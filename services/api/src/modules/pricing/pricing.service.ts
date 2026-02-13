import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PokemonTcgService } from '../pokemon-tcg/pokemon-tcg.service';
import { PokemonApiService } from '../pokemon-tcg/pokemon-api.service';

const TCGDEX_DELAY_MS = 300;
const POKEMON_API_DELAY_MS = 700; // ~100 req/day limit, be conservative
const BATCH_SIZE = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Grade multipliers applied to raw card prices to estimate graded slab values.
 * Based on average eBay sold data across the Pokemon TCG market.
 * Key = grade number (rounded), value = multiplier on raw market price.
 */
const GRADE_MULTIPLIERS: Record<string, Record<number, number>> = {
  psa: { 10: 5, 9: 2, 8: 1.5, 7: 1.2, 6: 1, 5: 0.9, 4: 0.8, 3: 0.7, 2: 0.6, 1: 0.5 },
  cgc: { 10: 6, 9: 1.8, 8: 1.3, 7: 1.1, 6: 1, 5: 0.9, 4: 0.8, 3: 0.7, 2: 0.6, 1: 0.5 },
  bgs: { 10: 8, 9: 2, 8: 1.4, 7: 1.1, 6: 1, 5: 0.9, 4: 0.8, 3: 0.7, 2: 0.6, 1: 0.5 },
  sgc: { 10: 4, 9: 1.8, 8: 1.3, 7: 1.1, 6: 1, 5: 0.9, 4: 0.8, 3: 0.7, 2: 0.6, 1: 0.5 },
};

function getGradeMultiplier(grader: string | null, grade: string | null): number {
  if (!grader || !grade) return 1;
  const graderKey = grader.toLowerCase();
  const gradeNum = Math.round(parseFloat(grade));
  if (isNaN(gradeNum)) return 1;
  const multipliers = GRADE_MULTIPLIERS[graderKey];
  if (!multipliers) return 1;
  return multipliers[gradeNum] ?? 1;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private pokemonTcgService: PokemonTcgService,
    private pokemonApiService: PokemonApiService,
  ) {}

  async getLatestPrice(slabId: string) {
    return this.prisma.price.findFirst({
      where: { slabId },
      orderBy: { retrievedAt: 'desc' },
    });
  }

  async getPriceHistory(slabId: string) {
    return this.prisma.priceSnapshotDaily.findMany({
      where: { slabId },
      orderBy: { date: 'asc' },
    });
  }

  /** Run at 6 AM and 6 PM UTC every day */
  @Cron('0 6,18 * * *')
  async scheduledPriceRefresh() {
    this.logger.log('Scheduled price refresh started');
    await this.refreshAllPrices();
  }

  /**
   * Refresh prices for ALL slabs.
   * Phase 1: Pokemon-API.com — real graded prices from Cardmarket (up to 90 calls/run)
   * Phase 2: TCGdex — raw price + grade multiplier as fallback (unlimited)
   */
  async refreshAllPrices(): Promise<number> {
    if (this.isRunning) {
      this.logger.warn('Price refresh already running, skipping');
      return 0;
    }
    this.isRunning = true;

    try {
      const slabs = await this.prisma.slab.findMany({
        where: { cardName: { not: null } },
        select: {
          id: true,
          cardName: true,
          cardNumber: true,
          setName: true,
          grader: true,
          grade: true,
        },
      });

      if (slabs.length === 0) {
        this.logger.log('No slabs to price');
        return 0;
      }

      // Group slabs by unique card identity (cardName + setName)
      const mkKey = (name: string, set: string | null) =>
        `${name.toLowerCase()}|${(set ?? '').toLowerCase()}`;

      const cardGroups = new Map<string, typeof slabs>();
      for (const slab of slabs) {
        const key = mkKey(slab.cardName!, slab.setName);
        if (!cardGroups.has(key)) cardGroups.set(key, []);
        cardGroups.get(key)!.push(slab);
      }

      this.logger.log(
        `Pricing ${slabs.length} slabs (${cardGroups.size} unique cards)`,
      );

      let totalPriced = 0;
      const now = new Date();
      const pricedSlabIds = new Set<string>();
      const priceInserts: Parameters<typeof this.prisma.price.create>[0]['data'][] = [];

      // ── Phase 1: Pokemon-API.com (real graded prices) ──
      if (this.pokemonApiService.isAvailable()) {
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const recentPrices = await this.prisma.price.findMany({
          where: {
            source: 'pokemon-api',
            retrievedAt: { gte: new Date(now.getTime() - TWENTY_FOUR_HOURS) },
          },
          select: { slabId: true },
          distinct: ['slabId'],
        });
        const recentlyPriced = new Set(recentPrices.map((p) => p.slabId));

        const needsRefresh: [string, typeof slabs][] = [];
        for (const [key, groupSlabs] of cardGroups) {
          if (!groupSlabs.every((s) => recentlyPriced.has(s.id))) {
            needsRefresh.push([key, groupSlabs]);
          }
        }

        this.logger.log(
          `Pokemon-API: ${needsRefresh.length}/${cardGroups.size} cards need refresh`,
        );

        let apiFetched = 0;
        const maxCalls = 90; // save 10 for on-demand requests

        for (const [, groupSlabs] of needsRefresh) {
          if (apiFetched >= maxCalls) break;

          const rep = groupSlabs[0];
          await sleep(POKEMON_API_DELAY_MS);
          const results = await this.pokemonApiService.searchCards(
            rep.cardName!,
            rep.setName ?? undefined,
          );
          apiFetched++;

          if (results.length === 0) continue;

          const match = this.pokemonApiService.findBestMatch(
            results,
            rep.cardName!,
            rep.setName ?? undefined,
            rep.cardNumber ?? undefined,
          );
          if (!match) continue;

          for (const slab of groupSlabs) {
            if (recentlyPriced.has(slab.id)) {
              pricedSlabIds.add(slab.id);
              continue;
            }

            const gradedPrice = slab.grader && slab.grade
              ? this.pokemonApiService.extractGradedPrice(match, slab.grader, slab.grade)
              : null;

            if (gradedPrice) {
              priceInserts.push({
                slabId: slab.id,
                source: 'pokemon-api',
                marketPrice: gradedPrice.price,
                currency: gradedPrice.currency,
                confidence: 'high',
                retrievedAt: now,
                rawResponse: {
                  pokemonApiCardId: match.id,
                  cardName: match.name,
                  setName: match.episode?.name,
                  gradedSource: gradedPrice.source,
                  grader: slab.grader,
                  grade: slab.grade,
                } as any,
              });
            } else {
              // Raw price from Pokemon-API + grade multiplier
              const rawPrice = this.pokemonApiService.extractRawPrice(match);
              if (rawPrice) {
                const multiplier = getGradeMultiplier(slab.grader, slab.grade);
                priceInserts.push({
                  slabId: slab.id,
                  source: 'pokemon-api',
                  marketPrice: Math.round(rawPrice.price * multiplier * 100) / 100,
                  currency: rawPrice.currency,
                  confidence: 'medium',
                  retrievedAt: now,
                  rawResponse: {
                    pokemonApiCardId: match.id,
                    rawPrice: rawPrice.price,
                    gradeMultiplier: multiplier,
                    grader: slab.grader,
                    grade: slab.grade,
                  } as any,
                });
              }
            }
            pricedSlabIds.add(slab.id);
            totalPriced++;

            if (priceInserts.length >= BATCH_SIZE) {
              await this.flushPrices(priceInserts);
              priceInserts.length = 0;
            }
          }

          if (apiFetched % 20 === 0) {
            this.logger.log(`  Pokemon-API: ${apiFetched} calls made`);
          }
        }

        if (priceInserts.length > 0) {
          await this.flushPrices(priceInserts);
          priceInserts.length = 0;
        }

        this.logger.log(
          `Pokemon-API phase done: ${totalPriced} slabs priced (${apiFetched} API calls)`,
        );
      }

      // ── Phase 2: TCGdex fallback for remaining slabs ──
      const unpricedSlabs = slabs.filter((s) => !pricedSlabIds.has(s.id));

      if (unpricedSlabs.length > 0) {
        this.logger.log(
          `TCGdex fallback: pricing ${unpricedSlabs.length} remaining slabs`,
        );

        const cardRefs = await this.prisma.cardReference.findMany({
          select: { ptcgCardId: true, cardName: true, cardNumber: true, setName: true },
        });
        const refByNameSet = new Map<string, string>();
        const refByNumSet = new Map<string, string>();
        for (const ref of cardRefs) {
          refByNameSet.set(
            `${ref.cardName.toLowerCase()}|${ref.setName.toLowerCase()}`,
            ref.ptcgCardId,
          );
          refByNumSet.set(
            `${ref.cardNumber}|${ref.setName.toLowerCase()}`,
            ref.ptcgCardId,
          );
        }

        const cardIdToSlabs = new Map<string, typeof unpricedSlabs>();
        for (const slab of unpricedSlabs) {
          const setKey = (slab.setName ?? '').toLowerCase();
          const ptcgCardId =
            refByNameSet.get(`${slab.cardName!.toLowerCase()}|${setKey}`) ??
            (slab.cardNumber ? refByNumSet.get(`${slab.cardNumber}|${setKey}`) : null);
          if (ptcgCardId) {
            if (!cardIdToSlabs.has(ptcgCardId)) cardIdToSlabs.set(ptcgCardId, []);
            cardIdToSlabs.get(ptcgCardId)!.push(slab);
          }
        }

        let tcgdexPriced = 0;
        for (const [tcgCardId, cardSlabs] of cardIdToSlabs) {
          await sleep(TCGDEX_DELAY_MS);
          const cardPricing = await this.pokemonTcgService.getCardPricing(tcgCardId);
          if (!cardPricing?.pricing) continue;

          const rawPrice = this.pokemonTcgService.extractMarketPrice(cardPricing.pricing);
          if (!rawPrice) continue;

          for (const slab of cardSlabs) {
            const multiplier = getGradeMultiplier(slab.grader, slab.grade);
            priceInserts.push({
              slabId: slab.id,
              source: 'tcgdex',
              marketPrice: Math.round(rawPrice.price * multiplier * 100) / 100,
              currency: rawPrice.currency,
              confidence: multiplier > 1 ? 'low' : 'medium',
              retrievedAt: now,
              rawResponse: {
                rawPrice: rawPrice.price,
                variant: rawPrice.variant,
                gradeMultiplier: multiplier,
                grader: slab.grader,
                grade: slab.grade,
              } as any,
            });
            tcgdexPriced++;
          }

          if (priceInserts.length >= BATCH_SIZE) {
            await this.flushPrices(priceInserts);
            priceInserts.length = 0;
          }
        }

        if (priceInserts.length > 0) {
          await this.flushPrices(priceInserts);
        }

        this.logger.log(`TCGdex fallback done: ${tcgdexPriced} additional slabs priced`);
        totalPriced += tcgdexPriced;
      }

      this.logger.log(
        `Price refresh complete: ${totalPriced}/${slabs.length} slabs priced`,
      );
      return totalPriced;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * On-demand pricing for a specific owner (called from summary endpoint).
   * Uses Pokemon-API.com for graded prices, TCGdex as fallback.
   */
  async fetchPricesForOwner(ownerAddress: string): Promise<number> {
    const slabs = await this.prisma.slab.findMany({
      where: {
        assetRaw: { ownerAddress },
        cardName: { not: null },
      },
      include: {
        prices: {
          orderBy: { retrievedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (slabs.length === 0) return 0;

    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = new Date();
    const needsPricing = slabs.filter((s) => {
      const latest = s.prices[0];
      return !latest || now.getTime() - latest.retrievedAt.getTime() > TWELVE_HOURS;
    });

    if (needsPricing.length === 0) {
      this.logger.debug(`All slabs for ${ownerAddress} already priced recently`);
      return 0;
    }

    this.logger.log(`Pricing ${needsPricing.length} slabs for ${ownerAddress}`);

    // Group by unique card
    const mkKey = (name: string, set: string | null) =>
      `${name.toLowerCase()}|${(set ?? '').toLowerCase()}`;

    const cardGroups = new Map<string, typeof needsPricing>();
    for (const slab of needsPricing) {
      const key = mkKey(slab.cardName!, slab.setName);
      if (!cardGroups.has(key)) cardGroups.set(key, []);
      cardGroups.get(key)!.push(slab);
    }

    let priced = 0;
    const pricedSlabIds = new Set<string>();

    // Phase 1: Pokemon-API.com
    if (this.pokemonApiService.isAvailable()) {
      for (const [, groupSlabs] of cardGroups) {
        const rep = groupSlabs[0];
        await sleep(POKEMON_API_DELAY_MS);
        const results = await this.pokemonApiService.searchCards(
          rep.cardName!,
          rep.setName ?? undefined,
        );
        if (results.length === 0) continue;

        const match = this.pokemonApiService.findBestMatch(
          results,
          rep.cardName!,
          rep.setName ?? undefined,
          rep.cardNumber ?? undefined,
        );
        if (!match) continue;

        for (const slab of groupSlabs) {
          const gradedPrice = slab.grader && slab.grade
            ? this.pokemonApiService.extractGradedPrice(match, slab.grader, slab.grade)
            : null;

          if (gradedPrice) {
            await this.prisma.price.create({
              data: {
                slabId: slab.id,
                source: 'pokemon-api',
                marketPrice: gradedPrice.price,
                currency: gradedPrice.currency,
                confidence: 'high',
                retrievedAt: new Date(),
                rawResponse: {
                  pokemonApiCardId: match.id,
                  gradedSource: gradedPrice.source,
                  grader: slab.grader,
                  grade: slab.grade,
                } as any,
              },
            });
            pricedSlabIds.add(slab.id);
            priced++;
          } else {
            const rawPrice = this.pokemonApiService.extractRawPrice(match);
            if (rawPrice) {
              const multiplier = getGradeMultiplier(slab.grader, slab.grade);
              await this.prisma.price.create({
                data: {
                  slabId: slab.id,
                  source: 'pokemon-api',
                  marketPrice: Math.round(rawPrice.price * multiplier * 100) / 100,
                  currency: rawPrice.currency,
                  confidence: 'medium',
                  retrievedAt: new Date(),
                  rawResponse: {
                    pokemonApiCardId: match.id,
                    rawPrice: rawPrice.price,
                    gradeMultiplier: multiplier,
                    grader: slab.grader,
                    grade: slab.grade,
                  } as any,
                },
              });
              pricedSlabIds.add(slab.id);
              priced++;
            }
          }
        }
      }
    }

    // Phase 2: TCGdex fallback
    const remaining = needsPricing.filter((s) => !pricedSlabIds.has(s.id));
    if (remaining.length > 0) {
      const cardRefs = await this.prisma.cardReference.findMany({
        select: { ptcgCardId: true, cardName: true, cardNumber: true, setName: true },
      });
      const refByNameSet = new Map<string, string>();
      const refByNumSet = new Map<string, string>();
      for (const ref of cardRefs) {
        refByNameSet.set(
          `${ref.cardName.toLowerCase()}|${ref.setName.toLowerCase()}`,
          ref.ptcgCardId,
        );
        refByNumSet.set(
          `${ref.cardNumber}|${ref.setName.toLowerCase()}`,
          ref.ptcgCardId,
        );
      }

      const cardIdToSlabs = new Map<string, typeof remaining>();
      for (const slab of remaining) {
        const setKey = (slab.setName ?? '').toLowerCase();
        const ptcgCardId =
          refByNameSet.get(`${slab.cardName!.toLowerCase()}|${setKey}`) ??
          (slab.cardNumber ? refByNumSet.get(`${slab.cardNumber}|${setKey}`) : null);
        if (ptcgCardId) {
          if (!cardIdToSlabs.has(ptcgCardId)) cardIdToSlabs.set(ptcgCardId, []);
          cardIdToSlabs.get(ptcgCardId)!.push(slab);
        }
      }

      for (const [tcgCardId, cardSlabs] of cardIdToSlabs) {
        await sleep(TCGDEX_DELAY_MS);
        const cardPricing = await this.pokemonTcgService.getCardPricing(tcgCardId);
        if (!cardPricing?.pricing) continue;

        const rawPrice = this.pokemonTcgService.extractMarketPrice(cardPricing.pricing);
        if (!rawPrice) continue;

        for (const slab of cardSlabs) {
          const multiplier = getGradeMultiplier(slab.grader, slab.grade);
          await this.prisma.price.create({
            data: {
              slabId: slab.id,
              source: 'tcgdex',
              marketPrice: Math.round(rawPrice.price * multiplier * 100) / 100,
              currency: rawPrice.currency,
              confidence: multiplier > 1 ? 'low' : 'medium',
              retrievedAt: new Date(),
              rawResponse: {
                rawPrice: rawPrice.price,
                variant: rawPrice.variant,
                gradeMultiplier: multiplier,
                grader: slab.grader,
                grade: slab.grade,
              } as any,
            },
          });
          priced++;
        }
      }
    }

    this.logger.log(`Priced ${priced}/${needsPricing.length} slabs for ${ownerAddress}`);
    return priced;
  }

  private async flushPrices(
    inserts: Parameters<typeof this.prisma.price.create>[0]['data'][],
  ) {
    await Promise.all(
      inserts.map((data) => this.prisma.price.create({ data })),
    );
  }
}

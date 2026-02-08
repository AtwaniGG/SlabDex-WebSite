import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceTrackerService } from './price-tracker.service';
import type { PriceTrackerCard } from './price-tracker.service';

const PRICE_TTL_MS = 24 * 60 * 60 * 1000; // Skip if price < 24h old
const CREDIT_BUDGET = 90; // Stop before hitting free tier limit (100/day)
const REQUEST_DELAY_MS = 1100; // 60 req/min → 1 req/sec with buffer

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private priceTrackerService: PriceTrackerService,
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

  /**
   * Fetch graded prices from PokemonPriceTracker for all slabs owned by an address.
   * Uses eBay sold data to get PSA/BGS/CGC grade-specific pricing.
   * Rate-limited to 1 req/sec to respect API limits.
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

    if (slabs.length === 0) {
      this.logger.log(`No priceable slabs for ${ownerAddress}`);
      return 0;
    }

    let priced = 0;
    let creditsUsed = 0;
    const now = new Date();

    for (const slab of slabs) {
      // Stop if we're close to the credit limit
      if (creditsUsed >= CREDIT_BUDGET) {
        this.logger.log(`Credit budget exhausted (${creditsUsed} used), stopping`);
        break;
      }

      // Skip if we already have a recent price
      const latestPrice = slab.prices[0];
      if (latestPrice && now.getTime() - latestPrice.retrievedAt.getTime() < PRICE_TTL_MS) {
        continue;
      }

      if (!slab.cardName) continue;

      // Search by card name only — set names from Courtyard are too specific
      // and don't match the API's TCGPlayer-based set names
      const query = slab.cardName;

      // Rate limit: wait before each request
      await sleep(REQUEST_DELAY_MS);

      // Search with graded data (2 credits: 1 for card + 1 for eBay data)
      const cards = await this.priceTrackerService.searchCards(query, true);

      // null = rate limited (429), don't count credits, back off and retry
      if (cards === null) {
        this.logger.warn('Rate limited by PriceTracker, backing off 5s');
        await sleep(5000);
        continue;
      }

      creditsUsed += 2;

      if (cards.length === 0) {
        this.logger.debug(`No results for "${query}"`);
        continue;
      }

      // Use the first result (best match)
      const card = cards[0];
      const extracted = this.extractGradedPrice(card, slab.grader, slab.grade);

      if (!extracted) {
        this.logger.debug(`No price extracted for "${query}"`);
        continue;
      }

      await this.prisma.price.create({
        data: {
          slabId: slab.id,
          source: 'price_tracker',
          marketPrice: extracted.marketPrice,
          currency: 'USD',
          confidence: extracted.confidence,
          retrievedAt: new Date(),
          rawResponse: card as any,
        },
      });

      priced++;
      this.logger.debug(
        `Priced "${slab.cardName}" (${slab.grader} ${slab.grade}) → $${extracted.marketPrice} [${extracted.confidence}]`,
      );
    }

    this.logger.log(`Priced ${priced}/${slabs.length} slabs for ${ownerAddress} (${creditsUsed} credits used)`);
    return priced;
  }

  /**
   * Extract grade-specific price from PokemonPriceTracker eBay sales data.
   *
   * Response structure: ebay.salesByGrade.{grader}{grade}
   *   PSA 10 → salesByGrade.psa10.smartMarketPrice.price (preferred) or averagePrice
   *   CGC 9.5 → salesByGrade.cgc10 (rounded) or cgc9
   *   BGS 10 → salesByGrade.bgs10
   *
   * Falls back to raw card market price if no grade-specific data.
   */
  private extractGradedPrice(
    card: PriceTrackerCard,
    grader: string | null,
    grade: string | null,
  ): { marketPrice: number; confidence: string } | null {
    const salesByGrade = card.ebay?.salesByGrade;

    if (salesByGrade && grader && grade) {
      const graderKey = grader.toLowerCase();
      const gradeNum = Math.round(parseFloat(grade));
      const ebayKey = `${graderKey}${gradeNum}`;

      const gradeData = salesByGrade[ebayKey];
      if (gradeData) {
        // Prefer smartMarketPrice (weighted/filtered), fall back to averagePrice
        const price = gradeData.smartMarketPrice?.price ?? gradeData.averagePrice;
        if (price && price > 0) {
          const confidence = gradeData.smartMarketPrice?.confidence ?? 'medium';
          return {
            marketPrice: Math.round(price * 100) / 100,
            confidence,
          };
        }
      }

      // Try same grade number with other common graders
      for (const g of ['psa', 'bgs', 'cgc', 'sgc']) {
        if (g === graderKey) continue;
        const fallbackData = salesByGrade[`${g}${gradeNum}`];
        if (fallbackData) {
          const price = fallbackData.smartMarketPrice?.price ?? fallbackData.averagePrice;
          if (price && price > 0) {
            return {
              marketPrice: Math.round(price * 100) / 100,
              confidence: 'medium',
            };
          }
        }
      }
    }

    // Fallback: raw card market price (not grade-specific)
    if (card.prices?.market && card.prices.market > 0) {
      return {
        marketPrice: Math.round(card.prices.market * 100) / 100,
        confidence: 'low',
      };
    }

    return null;
  }
}

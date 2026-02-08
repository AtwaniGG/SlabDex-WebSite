import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PokemonTcgService } from '../pokemon-tcg/pokemon-tcg.service';

// Skip re-seed if data was seeded within this window
const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class CatalogSeedService implements OnModuleInit {
  private readonly logger = new Logger(CatalogSeedService.name);

  constructor(
    private prisma: PrismaService,
    private pokemonTcgService: PokemonTcgService,
  ) {}

  async onModuleInit() {
    this.seed().catch((e) => this.logger.error(`Catalog seed failed: ${e}`));
  }

  async seed() {
    // Check staleness: if we already have sets with ptcgSetId, check the most
    // recently created CardReference to decide if we need to re-seed
    const recentCard = await this.prisma.cardReference.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const setCount = await this.prisma.setReference.count({
      where: { ptcgSetId: { not: null } },
    });

    if (recentCard && setCount > 400) {
      this.logger.log(
        `Catalog already seeded (${setCount} sets, cards present). Skipping.`,
      );
      return;
    }

    this.logger.log('Seeding catalog from Pokemon TCG API...');

    // --- Seed sets ---
    const sets = await this.pokemonTcgService.getAllSets();
    if (sets.length === 0) {
      this.logger.warn('Pokemon TCG API returned no sets, aborting seed');
      return;
    }

    let seededSets = 0;
    for (const set of sets) {
      const releaseYear = set.releaseDate
        ? parseInt(set.releaseDate.split('/')[0], 10) || null
        : null;

      try {
        await this.prisma.setReference.upsert({
          where: { setName: set.name },
          create: {
            setName: set.name,
            ptcgSetId: set.id,
            series: set.series,
            totalCards: set.total,
            releaseYear,
          },
          update: {
            ptcgSetId: set.id,
            series: set.series,
            totalCards: set.total,
            releaseYear,
          },
        });
        seededSets++;
      } catch (e) {
        this.logger.debug(`Skipped set "${set.name}": ${e}`);
      }
    }
    this.logger.log(`Seeded ${seededSets} sets`);

    // Build a map from ptcgSetId → setReference for card seeding
    const setRefs = await this.prisma.setReference.findMany({
      where: { ptcgSetId: { not: null } },
      select: { id: true, ptcgSetId: true, setName: true },
    });
    const setRefMap = new Map(
      setRefs.map((r) => [r.ptcgSetId!, { id: r.id, setName: r.setName }]),
    );

    // --- Seed cards per set (more reliable than bulk fetch) ---
    let seededCards = 0;
    let setsProcessed = 0;
    for (const set of sets) {
      const ref = setRefMap.get(set.id);
      if (!ref) continue;

      // Skip sets we already have cards for
      const existingCount = await this.prisma.cardReference.count({
        where: { setRefId: ref.id },
      });
      if (existingCount >= set.total) {
        setsProcessed++;
        seededCards += existingCount;
        continue;
      }

      const cards = await this.pokemonTcgService.getCardsForSet(set.id);
      if (cards.length === 0) {
        setsProcessed++;
        continue;
      }

      const upserts = cards.map((card) =>
        this.prisma.cardReference.upsert({
          where: { ptcgCardId: card.id },
          create: {
            ptcgCardId: card.id,
            cardName: card.name,
            cardNumber: card.number,
            setRefId: ref.id,
            setName: ref.setName,
            imageSmall: card.images?.small ?? null,
            imageLarge: card.images?.large ?? null,
          },
          update: {
            cardName: card.name,
            cardNumber: card.number,
            setName: ref.setName,
            imageSmall: card.images?.small ?? null,
            imageLarge: card.images?.large ?? null,
          },
        }),
      );

      // Batch upserts in chunks to avoid overwhelming the DB
      const CHUNK = 50;
      for (let i = 0; i < upserts.length; i += CHUNK) {
        await Promise.all(upserts.slice(i, i + CHUNK));
      }
      seededCards += cards.length;
      setsProcessed++;

      if (setsProcessed % 25 === 0) {
        this.logger.log(
          `  ... ${setsProcessed}/${sets.length} sets, ${seededCards} cards`,
        );
      }
    }

    this.logger.log(
      `Catalog seed complete: ${seededSets} sets, ${seededCards} cards`,
    );
  }
}

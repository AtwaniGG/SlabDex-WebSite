import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PokemonTcgService } from '../pokemon-tcg/pokemon-tcg.service';
import { POKELLECTOR_LOGOS } from '../../data/jp-sets';

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

    if (recentCard && setCount > 195) {
      this.logger.log(
        `Catalog already seeded (${setCount} sets, cards present). Skipping.`,
      );
      await this.backfillLogos();
      return;
    }

    this.logger.log('Seeding EN catalog from TCGdex API...');

    // --- Seed sets ---
    const sets = await this.pokemonTcgService.getAllSets();
    if (sets.length === 0) {
      this.logger.warn('TCGdex API returned no sets, aborting seed');
      return;
    }

    let seededSets = 0;
    for (const set of sets) {
      const releaseYear = set.releaseDate
        ? parseInt(set.releaseDate.split('-')[0], 10) || null
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
            logoUrl: set.images?.logo ? `${set.images.logo}.png` : null,
            symbolUrl: set.images?.symbol ? `${set.images.symbol}.png` : null,
          },
          update: {
            ptcgSetId: set.id,
            series: set.series,
            totalCards: set.total,
            releaseYear,
            logoUrl: set.images?.logo ? `${set.images.logo}.png` : null,
            symbolUrl: set.images?.symbol ? `${set.images.symbol}.png` : null,
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

  /** Backfill logoUrl for sets missing logos or with incorrect URLs (no .png extension). */
  private async backfillLogos() {
    const missing = await this.prisma.setReference.count({
      where: {
        OR: [
          { logoUrl: null },
          { logoUrl: { not: { endsWith: '.png' } } },
        ],
      },
    });
    if (missing === 0) return;

    this.logger.log(`Backfilling logos for ${missing} sets...`);

    // Use fast list endpoint (1 request) instead of fetching each set detail
    const setLogos = await this.pokemonTcgService.getAllSetLogos();

    // Build lookup maps by both id and name for maximum matching
    const logoById = new Map<string, typeof setLogos[0]>();
    const logoByName = new Map<string, typeof setLogos[0]>();
    for (const s of setLogos) {
      logoById.set(s.id, s);
      logoByName.set(s.name.toLowerCase(), s);
    }

    // Fetch all sets that need logos
    const setsNeedingLogos = await this.prisma.setReference.findMany({
      where: {
        OR: [
          { logoUrl: null },
          { logoUrl: { not: { endsWith: '.png' } } },
        ],
      },
      select: { id: true, setName: true, ptcgSetId: true },
    });

    // Also create SetReference records for slab set names that don't exist yet
    // (JP/specialty sets referenced by slabs but never seeded from TCGdex)
    const orphanSetNames: string[] = await this.prisma.$queryRaw`
      SELECT DISTINCT s.set_name
      FROM slabs s
      LEFT JOIN set_references sr ON sr.set_name = s.set_name
      WHERE s.set_name IS NOT NULL AND sr.id IS NULL
    `;
    if (orphanSetNames.length > 0) {
      this.logger.log(`Creating ${orphanSetNames.length} missing SetReference records...`);
      for (const row of orphanSetNames) {
        const name = (row as any).set_name as string;
        const pkLogo = POKELLECTOR_LOGOS[name.toLowerCase()] ?? null;
        try {
          await this.prisma.setReference.create({
            data: {
              setName: name,
              totalCards: 0,
              logoUrl: pkLogo,
            },
          });
        } catch {
          // Already exists or other constraint
        }
      }
    }

    // Re-fetch after creating new records
    const allNeedingLogos = await this.prisma.setReference.findMany({
      where: {
        OR: [
          { logoUrl: null },
          { logoUrl: { not: { endsWith: '.png' } } },
        ],
      },
      select: { id: true, setName: true, ptcgSetId: true },
    });

    let updated = 0;
    for (const dbSet of allNeedingLogos) {
      // 1) Try TCGdex EN: match by ptcgSetId first, then by name
      const match =
        (dbSet.ptcgSetId ? logoById.get(dbSet.ptcgSetId) : null) ??
        logoByName.get(dbSet.setName.toLowerCase());

      if (match?.logo) {
        try {
          await this.prisma.setReference.update({
            where: { id: dbSet.id },
            data: {
              logoUrl: `${match.logo}.png`,
              symbolUrl: match.symbol ? `${match.symbol}.png` : null,
            },
          });
          updated++;
          continue;
        } catch {
          // Skip conflicts
        }
      }

      // 2) Fallback: Pokellector static mapping for JP/specialty sets
      const pokellectorLogo = POKELLECTOR_LOGOS[dbSet.setName.toLowerCase()];
      if (pokellectorLogo) {
        try {
          await this.prisma.setReference.update({
            where: { id: dbSet.id },
            data: { logoUrl: pokellectorLogo },
          });
          updated++;
        } catch {
          // Skip conflicts
        }
      }
    }
    this.logger.log(`Logo backfill complete (${updated} sets updated)`);
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import IORedis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { TcgdexAdapter } from './tcgdex.adapter';
import { EbayService } from './ebay.service';
import { REDIS_CLIENT } from './redis.provider';

const TTL_FREE = 24 * 60 * 60; // 24 hours in seconds
const TTL_PREMIUM = 6 * 60 * 60; // 6 hours in seconds

interface CachedPrice {
  priceUsd: number | null;
  updatedAt: string;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private tcgdexAdapter: TcgdexAdapter,
    private ebayService: EbayService,
    @Inject(REDIS_CLIENT) private redis: IORedis,
  ) {}

  /**
   * Get the price for a slab by its ID.
   * 1. Check Redis cache
   * 2. If miss → check Postgres
   * 3. If miss → call adapter, store, cache
   * Refresh happens asynchronously when cache is expired.
   */
  async getSlabPrice(
    slabId: string,
    tier: 'free' | 'premium' = 'free',
  ): Promise<{ priceUsd: number | null; updatedAt: string | null }> {
    const cacheKey = `price:slab:${slabId}`;
    const ttl = tier === 'premium' ? TTL_PREMIUM : TTL_FREE;

    // 1. Check Redis cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed: CachedPrice = JSON.parse(cached);

      // Trigger async refresh if nearing expiry (last 10% of TTL)
      const redisTtl = await this.redis.ttl(cacheKey);
      if (redisTtl > 0 && redisTtl < ttl * 0.1) {
        this.refreshPrice(slabId, tier).catch((e) =>
          this.logger.error(`Async refresh failed for ${slabId}: ${e}`),
        );
      }

      return { priceUsd: parsed.priceUsd, updatedAt: parsed.updatedAt };
    }

    // 2. Check Postgres
    const dbPrice = await this.prisma.slabPrice.findUnique({
      where: { slabId },
    });

    if (dbPrice) {
      const result = {
        priceUsd: dbPrice.priceUsd ? Number(dbPrice.priceUsd) : null,
        updatedAt: dbPrice.updatedAt.toISOString(),
      };

      // Re-populate cache
      await this.setCache(cacheKey, result, ttl);

      // If stale, trigger async refresh
      const age = Date.now() - dbPrice.updatedAt.getTime();
      if (age > ttl * 1000) {
        this.refreshPrice(slabId, tier).catch((e) =>
          this.logger.error(`Async refresh failed for ${slabId}: ${e}`),
        );
      }

      return result;
    }

    // 3. No cached data — fetch synchronously
    return this.refreshPrice(slabId, tier);
  }

  /**
   * Fetch fresh price from the adapter, store in Postgres, cache in Redis.
   * Tries eBay graded listings first, then falls back to TCGdex × multiplier.
   */
  async refreshPrice(
    slabId: string,
    tier: 'free' | 'premium' = 'free',
  ): Promise<{ priceUsd: number | null; updatedAt: string | null }> {
    const slab = await this.prisma.slab.findUnique({
      where: { id: slabId },
      select: {
        certNumber: true,
        cardName: true,
        setName: true,
        grader: true,
        grade: true,
      },
    });

    if (!slab?.certNumber) {
      this.logger.warn(`Slab ${slabId} has no cert number, cannot price`);
      return { priceUsd: null, updatedAt: null };
    }

    try {
      let priceUsd: number | null = null;

      // 1. Try eBay graded listings first (real market prices)
      if (
        this.ebayService.isAvailable() &&
        slab.cardName &&
        slab.grader &&
        slab.grade
      ) {
        // Try with set name first
        const listings = await this.ebayService.searchGradedListings(
          slab.cardName,
          slab.setName,
          slab.grader,
          slab.grade,
        );
        if (listings && listings.length > 0) {
          const ebayResult = this.ebayService.extractGradedPrice(
            listings,
            slab.cardName,
            slab.grader,
            slab.grade,
          );
          if (ebayResult) {
            priceUsd = ebayResult.price;
            this.logger.debug(
              `eBay price for ${slab.certNumber}: $${priceUsd} (${ebayResult.confidence}, ${ebayResult.sampleSize} listings)`,
            );
          }
        }

        // Retry without set name if no eBay result yet (long/unusual set names)
        if (priceUsd === null && slab.setName) {
          const retryListings = await this.ebayService.searchGradedListings(
            slab.cardName,
            null,
            slab.grader,
            slab.grade,
          );
          if (retryListings && retryListings.length > 0) {
            const retryResult = this.ebayService.extractGradedPrice(
              retryListings,
              slab.cardName,
              slab.grader,
              slab.grade,
            );
            if (retryResult) {
              priceUsd = retryResult.price;
              this.logger.debug(
                `eBay price (no-set retry) for ${slab.certNumber}: $${priceUsd} (${retryResult.confidence}, ${retryResult.sampleSize} listings)`,
              );
            }
          }
        }
      }

      // 2. Fall back to TCGdex × grade multiplier
      if (priceUsd === null) {
        const tcgResult = await this.tcgdexAdapter.getPriceByCert(slab.certNumber);
        priceUsd = tcgResult.priceUsd;
        if (priceUsd !== null) {
          this.logger.debug(
            `TCGdex fallback for ${slab.certNumber}: $${priceUsd}`,
          );
        }
      }

      // Upsert into Postgres
      const record = await this.prisma.slabPrice.upsert({
        where: { slabId },
        create: {
          slabId,
          priceUsd,
        },
        update: {
          priceUsd,
        },
      });

      const response = {
        priceUsd,
        updatedAt: record.updatedAt.toISOString(),
      };

      // Cache in Redis
      const ttl = tier === 'premium' ? TTL_PREMIUM : TTL_FREE;
      await this.setCache(`price:slab:${slabId}`, response, ttl);

      return response;
    } catch (e) {
      this.logger.error(`Failed to fetch price for slab ${slabId}: ${e}`);
      return { priceUsd: null, updatedAt: null };
    }
  }

  /**
   * Price all slabs for an owner address. Returns count of priced slabs.
   */
  async priceSlabsForOwner(
    ownerAddress: string,
    tier: 'free' | 'premium' = 'free',
  ): Promise<number> {
    const slabs = await this.prisma.slab.findMany({
      where: {
        assetRaw: { ownerAddress },
        certNumber: { not: null },
      },
      select: { id: true },
    });

    let priced = 0;
    for (const slab of slabs) {
      const result = await this.getSlabPrice(slab.id, tier);
      if (result.priceUsd !== null) priced++;
    }

    return priced;
  }

  /**
   * Get total estimated value for an owner address from slab_prices table.
   */
  async getEstimatedValue(ownerAddress: string): Promise<number> {
    const result = await this.prisma.slabPrice.aggregate({
      where: {
        slab: { assetRaw: { ownerAddress } },
        priceUsd: { not: null },
      },
      _sum: { priceUsd: true },
    });
    return Number(result._sum.priceUsd ?? 0);
  }

  // TODO: Add multi-provider expansion here in Phase 2

  private async setCache(
    key: string,
    value: { priceUsd: number | null; updatedAt: string | null },
    ttl: number,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      this.logger.error(`Redis set failed for ${key}: ${e}`);
    }
  }
}

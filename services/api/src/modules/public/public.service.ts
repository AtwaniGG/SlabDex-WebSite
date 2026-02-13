import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SlabsService } from '../slabs/slabs.service';
import { SetsService } from '../sets/sets.service';
import { IndexingService } from '../indexing/indexing.service';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private prisma: PrismaService,
    private slabsService: SlabsService,
    private setsService: SetsService,
    private indexingService: IndexingService,
    private pricingService: PricingService,
  ) {}

  async getAddressSummary(address: string) {
    const normalizedAddress = address.toLowerCase();

    // Trigger indexing if data is stale or missing
    await this.indexingService.indexAddress(normalizedAddress);

    // Fire-and-forget: fetch prices in the background
    this.pricingService.fetchPricesForOwner(normalizedAddress).catch((e) =>
      this.logger.error(`Background price fetch failed: ${e}`),
    );

    const [totalSlabs, sets, totalValue] = await Promise.all([
      this.prisma.slab.count({
        where: { assetRaw: { ownerAddress: normalizedAddress } },
      }),
      this.setsService.getSetProgressByOwner(normalizedAddress),
      this.prisma.price.findMany({
        where: {
          slab: { assetRaw: { ownerAddress: normalizedAddress } },
        },
        distinct: ['slabId'],
        orderBy: { retrievedAt: 'desc' },
      }),
    ]);

    const estimatedValue = totalValue.reduce(
      (sum, p) => sum + Number(p.marketPrice),
      0,
    );

    return {
      address: normalizedAddress,
      totalSlabs,
      totalSets: sets.length,
      estimatedValueUsd: Math.round(estimatedValue * 100) / 100,
      sets,
    };
  }

  async getAddressSlabs(
    address: string,
    query: { set?: string; q?: string; grade?: string; sort?: 'price_asc' | 'price_desc'; page?: number },
  ) {
    return this.slabsService.getSlabsByOwner({
      ownerAddress: address.toLowerCase(),
      ...query,
    });
  }

  async getAddressSlabsBySet(address: string) {
    return this.slabsService.getSlabsGroupedBySets(address.toLowerCase());
  }

  async getAddressSets(address: string) {
    return this.setsService.getSetProgressByOwner(address.toLowerCase());
  }

  async getAddressSetDetail(address: string, setName: string) {
    return this.setsService.getSetDetailForOwner(
      address.toLowerCase(),
      setName,
    );
  }
}

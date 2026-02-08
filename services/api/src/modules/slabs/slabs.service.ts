import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@pokedex-slabs/shared';

export interface SlabsQuery {
  ownerAddress: string;
  set?: string;
  q?: string;
  grade?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class SlabsService {
  constructor(private prisma: PrismaService) {}

  async getSlabsByOwner(query: SlabsQuery) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, query.pageSize || DEFAULT_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      assetRaw: { ownerAddress: query.ownerAddress },
    };

    if (query.set) {
      (where as Record<string, unknown>).setName = query.set;
    }
    if (query.grade) {
      (where as Record<string, unknown>).grade = query.grade;
    }
    if (query.q) {
      (where as Record<string, unknown>).OR = [
        { cardName: { contains: query.q, mode: 'insensitive' } },
        { certNumber: { contains: query.q, mode: 'insensitive' } },
        { setName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [slabs, total] = await Promise.all([
      this.prisma.slab.findMany({
        where,
        include: {
          prices: {
            orderBy: { retrievedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.slab.count({ where }),
    ]);

    return {
      data: slabs.map((slab) => ({
        id: slab.id,
        certNumber: slab.certNumber,
        grader: slab.grader,
        grade: slab.grade,
        setName: slab.setName,
        cardName: slab.cardName,
        cardNumber: slab.cardNumber,
        variant: slab.variant,
        imageUrl: slab.imageUrl,
        parseStatus: slab.parseStatus,
        platform: slab.platform,
        marketPrice: slab.prices[0]?.marketPrice ?? null,
        priceCurrency: slab.prices[0]?.currency ?? null,
        priceRetrievedAt: slab.prices[0]?.retrievedAt ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getSlabsGroupedBySets(ownerAddress: string) {
    // Fetch all slabs for this owner in one query
    const slabs = await this.prisma.slab.findMany({
      where: { assetRaw: { ownerAddress } },
      include: {
        prices: {
          orderBy: { retrievedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ setName: 'asc' }, { cardNumber: 'asc' }],
    });

    // Get set reference data for totalCards
    const setNames = [...new Set(
      slabs.map((s) => s.setName).filter((n): n is string => n !== null),
    )];
    const setRefs = await this.prisma.setReference.findMany({
      where: { setName: { in: setNames } },
    });
    const refMap = new Map(setRefs.map((r) => [r.setName, r]));

    // Group slabs by setName
    const groupMap = new Map<string | null, typeof slabs>();
    for (const slab of slabs) {
      const key = slab.setName;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(slab);
    }

    const mapSlab = (slab: (typeof slabs)[0]) => ({
      id: slab.id,
      certNumber: slab.certNumber,
      grader: slab.grader,
      grade: slab.grade,
      setName: slab.setName,
      cardName: slab.cardName,
      cardNumber: slab.cardNumber,
      variant: slab.variant,
      imageUrl: slab.imageUrl,
      parseStatus: slab.parseStatus,
      platform: slab.platform,
      marketPrice: slab.prices[0]?.marketPrice ?? null,
      priceCurrency: slab.prices[0]?.currency ?? null,
      priceRetrievedAt: slab.prices[0]?.retrievedAt ?? null,
    });

    const groups: {
      setName: string | null;
      ownedCount: number;
      totalCards: number;
      completionPct: number;
      slabs: ReturnType<typeof mapSlab>[];
    }[] = [];

    for (const [setName, setSlabs] of groupMap) {
      if (setName === null) continue; // handle uncategorized separately
      const ref = refMap.get(setName);
      const totalCards = ref?.totalCards ?? 0;
      // Count unique cards by cardNumber (duplicate graded copies shouldn't inflate completion)
      const uniqueCards = new Set(
        setSlabs.map((s) => s.cardNumber).filter((n): n is string => n !== null),
      );
      const ownedCount = uniqueCards.size > 0 ? uniqueCards.size : setSlabs.length;
      groups.push({
        setName,
        ownedCount,
        totalCards,
        completionPct: totalCards > 0 ? Math.round((ownedCount / totalCards) * 10000) / 100 : 0,
        slabs: setSlabs.map(mapSlab),
      });
    }

    // Sort: completed first, then by completionPct DESC
    groups.sort((a, b) => {
      const aComplete = a.completionPct === 100 ? 1 : 0;
      const bComplete = b.completionPct === 100 ? 1 : 0;
      if (aComplete !== bComplete) return bComplete - aComplete;
      return b.completionPct - a.completionPct;
    });

    // Append uncategorized at the end
    const uncategorized = groupMap.get(null);
    if (uncategorized && uncategorized.length > 0) {
      groups.push({
        setName: null,
        ownedCount: uncategorized.length,
        totalCards: 0,
        completionPct: 0,
        slabs: uncategorized.map(mapSlab),
      });
    }

    return groups;
  }

  async getSlabById(id: string) {
    return this.prisma.slab.findUnique({
      where: { id },
      include: {
        assetRaw: true,
        prices: {
          orderBy: { retrievedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}

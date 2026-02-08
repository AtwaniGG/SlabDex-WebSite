import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SetsService {
  constructor(private prisma: PrismaService) {}

  async getSetProgressByOwner(ownerAddress: string) {
    // Fetch all slabs with cardNumber so we can count unique cards
    const slabs = await this.prisma.slab.findMany({
      where: {
        assetRaw: { ownerAddress },
        setName: { not: null },
      },
      select: { setName: true, cardNumber: true },
    });

    // Group slabs by setName and count unique card numbers
    const setMap = new Map<string, { cardNumbers: Set<string>; totalSlabs: number }>();
    for (const slab of slabs) {
      const key = slab.setName!;
      if (!setMap.has(key)) setMap.set(key, { cardNumbers: new Set(), totalSlabs: 0 });
      const entry = setMap.get(key)!;
      entry.totalSlabs++;
      if (slab.cardNumber) entry.cardNumbers.add(slab.cardNumber);
    }

    // Get total cards for each set from reference data
    const setNames = [...setMap.keys()];
    const setRefs = await this.prisma.setReference.findMany({
      where: { setName: { in: setNames } },
    });
    const refMap = new Map(setRefs.map((r) => [r.setName, r]));

    return [...setMap.entries()].map(([setName, entry]) => {
      const ref = refMap.get(setName);
      const totalCards = ref?.totalCards ?? 0;
      // Use unique card count if available, else fall back to slab count
      const ownedCount = entry.cardNumbers.size > 0 ? entry.cardNumbers.size : entry.totalSlabs;
      return {
        setName,
        ownedCount,
        totalCards,
        completionPct: totalCards > 0 ? Math.round((ownedCount / totalCards) * 10000) / 100 : 0,
        releaseYear: ref?.releaseYear ?? null,
        generation: ref?.generation ?? null,
      };
    });
  }
}

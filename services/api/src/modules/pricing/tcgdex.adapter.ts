import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PokemonTcgService } from '../pokemon-tcg/pokemon-tcg.service';
import { PricingAdapter } from './pricing-adapter.interface';

// Conservative multipliers: TCGPlayer market prices already reflect raw card value,
// so multipliers should be modest. PSA 10 ~2x raw, PSA 9 ~1.3x, lower grades near 1x.
const GRADE_MULTIPLIERS: Record<string, Record<number, number>> = {
  psa: { 10: 2, 9: 1.3, 8: 1.1, 7: 1, 6: 0.9, 5: 0.8, 4: 0.7, 3: 0.6 },
  cgc: { 10: 2.2, 9: 1.3, 8: 1.1, 7: 1, 6: 0.9, 5: 0.8, 4: 0.7, 3: 0.6 },
  bgs: { 10: 3, 9: 1.4, 8: 1.1, 7: 1, 6: 0.9, 5: 0.8, 4: 0.7, 3: 0.6 },
  sgc: { 10: 1.8, 9: 1.2, 8: 1.1, 7: 1, 6: 0.9, 5: 0.8, 4: 0.7, 3: 0.6 },
};

function getGradeMultiplier(grader: string | null, grade: string | null): number {
  if (!grader || !grade) return 1;
  const gradeFloat = parseFloat(grade);
  if (isNaN(gradeFloat)) return 1;
  const multipliers = GRADE_MULTIPLIERS[grader.toLowerCase()];
  if (!multipliers) return 1;
  return multipliers[gradeFloat] ?? multipliers[Math.floor(gradeFloat)] ?? 1;
}

@Injectable()
export class TcgdexAdapter implements PricingAdapter {
  private readonly logger = new Logger(TcgdexAdapter.name);

  constructor(
    private prisma: PrismaService,
    private pokemonTcgService: PokemonTcgService,
  ) {}

  async getPriceByCert(certNumber: string): Promise<{
    priceUsd: number | null;
    retrievedAt: Date;
  }> {
    // 1. Look up the slab by cert number
    const slab = await this.prisma.slab.findFirst({
      where: { certNumber },
      select: {
        cardName: true,
        cardNumber: true,
        setName: true,
        variant: true,
        grader: true,
        grade: true,
      },
    });

    if (!slab?.cardName) {
      this.logger.debug(`No slab found for cert ${certNumber}`);
      return { priceUsd: null, retrievedAt: new Date() };
    }

    // 2. Find the matching CardReference → ptcgCardId
    const ptcgCardId = await this.findCardId(
      slab.cardName,
      slab.cardNumber,
      slab.setName,
    );

    if (!ptcgCardId) {
      this.logger.debug(
        `No CardReference match for "${slab.cardName}" #${slab.cardNumber} (${slab.setName})`,
      );
      return { priceUsd: null, retrievedAt: new Date() };
    }

    // 3. Fetch pricing from TCGdex
    const cardPricing = await this.pokemonTcgService.getCardPricing(ptcgCardId);
    if (!cardPricing?.pricing) {
      this.logger.debug(`No pricing data from TCGdex for ${ptcgCardId}`);
      return { priceUsd: null, retrievedAt: new Date() };
    }

    // 4. Extract market price (variant-aware)
    const rawPrice = this.pokemonTcgService.extractMarketPrice(
      cardPricing.pricing,
      slab.variant,
    );

    if (!rawPrice) {
      this.logger.debug(`No market price extractable for ${ptcgCardId}`);
      return { priceUsd: null, retrievedAt: new Date() };
    }

    // 5. Apply grade multiplier
    const multiplier = getGradeMultiplier(slab.grader, slab.grade);
    const gradedPrice = Math.round(rawPrice.price * multiplier * 100) / 100;

    this.logger.debug(
      `cert:${certNumber} → ${ptcgCardId} → $${rawPrice.price} × ${multiplier} (${slab.grader} ${slab.grade}) = $${gradedPrice}`,
    );

    return {
      priceUsd: gradedPrice,
      retrievedAt: new Date(),
    };
  }

  /**
   * Find the TCGdex card ID by matching slab fields to CardReference.
   * Tries: cardName + cardNumber + setName → cardName + setName → cardName + cardNumber
   */
  private async findCardId(
    cardName: string,
    cardNumber: string | null,
    setName: string | null,
  ): Promise<string | null> {
    // Normalize card number: strip set-total suffix and leading zeros
    // e.g. "048/172" → "48", "025" → "25", "TG29/TG30" → "TG29"
    const normalizedNum = cardNumber
      ?.replace(/\/\d+$/, '')   // strip "/172" but keep "/TG30" style
      .replace(/^0+/, '')       // strip leading zeros
      || null;

    // Strategy 1: exact name + number + set
    if (normalizedNum && setName) {
      const match = await this.prisma.cardReference.findFirst({
        where: {
          cardName: { equals: cardName, mode: 'insensitive' },
          cardNumber: normalizedNum,
          setName: { equals: setName, mode: 'insensitive' },
        },
        select: { ptcgCardId: true },
      });
      if (match) return match.ptcgCardId;
    }

    // Strategy 2: exact name + set (no card number)
    if (setName) {
      const match = await this.prisma.cardReference.findFirst({
        where: {
          cardName: { equals: cardName, mode: 'insensitive' },
          setName: { equals: setName, mode: 'insensitive' },
        },
        select: { ptcgCardId: true },
      });
      if (match) return match.ptcgCardId;
    }

    // Strategy 3: exact name + number (any set)
    if (normalizedNum) {
      const match = await this.prisma.cardReference.findFirst({
        where: {
          cardName: { equals: cardName, mode: 'insensitive' },
          cardNumber: normalizedNum,
        },
        select: { ptcgCardId: true },
      });
      if (match) return match.ptcgCardId;
    }

    // Strategy 4: name only (if unambiguous — single result)
    const byName = await this.prisma.cardReference.findMany({
      where: {
        cardName: { equals: cardName, mode: 'insensitive' },
      },
      select: { ptcgCardId: true },
      take: 2,
    });
    if (byName.length === 1) return byName[0].ptcgCardId;

    return null;
  }
}

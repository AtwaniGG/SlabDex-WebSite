import { Injectable, Logger } from '@nestjs/common';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export interface PtcgSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate?: string;
  images?: { symbol?: string; logo?: string };
}

export interface PtcgCard {
  id: string;
  name: string;
  number: string;
  set: { id: string; name: string };
  images?: { small?: string; large?: string };
}

// TCGdex response shapes
interface TcgdexVariantPrices {
  lowPrice?: number;
  midPrice?: number;
  highPrice?: number;
  marketPrice?: number;
}

interface TcgdexPricing {
  tcgplayer?: {
    updated?: string;
    unit?: string;
    normal?: TcgdexVariantPrices;
    holofoil?: TcgdexVariantPrices;
    reverseHolofoil?: TcgdexVariantPrices;
    '1stEditionHolofoil'?: TcgdexVariantPrices;
    '1stEditionNormal'?: TcgdexVariantPrices;
    [key: string]: any;
  };
  cardmarket?: {
    updated?: string;
    unit?: string;
    avg?: number;
    low?: number;
    trend?: number;
  };
}

export interface TcgdexCardPricing {
  cardId: string;
  pricing: TcgdexPricing | null;
}

interface TcgdexSetListItem {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: { total?: number; official?: number };
}

interface TcgdexSetDetail {
  id: string;
  name: string;
  serie?: { id: string; name: string };
  releaseDate?: string;
  cardCount?: { total?: number; official?: number };
  logo?: string;
  symbol?: string;
  cards?: { id: string; localId: string; name: string; image?: string }[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PokemonTcgService {
  private readonly logger = new Logger(PokemonTcgService.name);

  private async fetchWithRetry(url: string, label: string): Promise<Response | null> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res;

        this.logger.warn(
          `${label} attempt ${attempt}/${MAX_RETRIES}: HTTP ${res.status}`,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      } catch (e) {
        this.logger.warn(
          `${label} attempt ${attempt}/${MAX_RETRIES} failed: ${e}`,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    this.logger.error(`${label} failed after ${MAX_RETRIES} attempts`);
    return null;
  }

  async getAllSets(): Promise<PtcgSet[]> {
    const res = await this.fetchWithRetry(
      `${TCGDEX_BASE}/sets`,
      'TCGdex /sets',
    );
    if (!res) return [];

    const data: TcgdexSetListItem[] = await res.json();

    // The list endpoint doesn't include serie or releaseDate,
    // so we fetch each set's detail for the full info.
    const sets: PtcgSet[] = [];
    for (const item of data) {
      const detailRes = await this.fetchWithRetry(
        `${TCGDEX_BASE}/sets/${item.id}`,
        `TCGdex /sets/${item.id}`,
      );
      if (!detailRes) continue;

      const detail: TcgdexSetDetail = await detailRes.json();
      sets.push({
        id: detail.id,
        name: detail.name,
        series: detail.serie?.name ?? 'Unknown',
        printedTotal: detail.cardCount?.official ?? detail.cardCount?.total ?? 0,
        total: detail.cardCount?.total ?? 0,
        releaseDate: detail.releaseDate,
        images: { symbol: detail.symbol, logo: detail.logo },
      });
    }

    return sets;
  }

  /** Fast: single request, returns id/name/logo only (no series/releaseDate). */
  async getAllSetLogos(): Promise<{ id: string; name: string; logo: string | null; symbol: string | null }[]> {
    const res = await this.fetchWithRetry(`${TCGDEX_BASE}/sets`, 'TCGdex /sets (logos)');
    if (!res) return [];
    const data: TcgdexSetListItem[] = await res.json();
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      logo: item.logo ?? null,
      symbol: item.symbol ?? null,
    }));
  }

  /**
   * Fetch pricing for a single card by its TCGdex card ID (e.g. "base1-4").
   * Returns TCGPlayer (USD) and Cardmarket (EUR) pricing.
   */
  async getCardPricing(cardId: string): Promise<TcgdexCardPricing | null> {
    const res = await this.fetchWithRetry(
      `${TCGDEX_BASE}/cards/${cardId}`,
      `TCGdex /cards/${cardId} (pricing)`,
    );
    if (!res) return null;

    const data = await res.json();
    return {
      cardId,
      pricing: data.pricing ?? null,
    };
  }

  /**
   * Extract the best USD market price from TCGdex pricing data.
   * Tries variants in order: normal > holofoil > reverseHolofoil > 1stEdition variants.
   * Falls back to Cardmarket EUR avg if no TCGPlayer data.
   */
  extractMarketPrice(pricing: TcgdexPricing | null): { price: number; currency: string; variant: string } | null {
    if (!pricing) return null;

    // Try TCGPlayer USD first
    if (pricing.tcgplayer) {
      const variants: [string, TcgdexVariantPrices | undefined][] = [
        ['normal', pricing.tcgplayer.normal],
        ['holofoil', pricing.tcgplayer.holofoil],
        ['reverseHolofoil', pricing.tcgplayer.reverseHolofoil],
        ['1stEditionHolofoil', pricing.tcgplayer['1stEditionHolofoil']],
        ['1stEditionNormal', pricing.tcgplayer['1stEditionNormal']],
      ];

      for (const [variant, data] of variants) {
        if (data?.marketPrice && data.marketPrice > 0) {
          return { price: Math.round(data.marketPrice * 100) / 100, currency: 'USD', variant };
        }
      }

      // Fallback to midPrice if no marketPrice
      for (const [variant, data] of variants) {
        if (data?.midPrice && data.midPrice > 0) {
          return { price: Math.round(data.midPrice * 100) / 100, currency: 'USD', variant };
        }
      }
    }

    // Fallback to Cardmarket EUR
    if (pricing.cardmarket) {
      const price = pricing.cardmarket.avg ?? pricing.cardmarket.trend ?? pricing.cardmarket.low;
      if (price && price > 0) {
        return { price: Math.round(price * 100) / 100, currency: 'EUR', variant: 'cardmarket' };
      }
    }

    return null;
  }

  async getCardsForSet(setId: string): Promise<PtcgCard[]> {
    const res = await this.fetchWithRetry(
      `${TCGDEX_BASE}/sets/${setId}`,
      `TCGdex /sets/${setId} (cards)`,
    );
    if (!res) return [];

    const detail: TcgdexSetDetail = await res.json();
    if (!detail.cards || detail.cards.length === 0) return [];

    return detail.cards.map((card) => ({
      id: card.id,
      name: card.name,
      number: card.localId,
      set: { id: detail.id, name: detail.name },
      images: card.image
        ? { small: `${card.image}/low.webp`, large: `${card.image}/high.webp` }
        : undefined,
    }));
  }
}

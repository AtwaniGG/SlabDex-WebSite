import { Injectable, Logger } from '@nestjs/common';

const TCGDEX_EN = 'https://api.tcgdex.net/v2/en';
const TCGDEX_JP = 'https://api.tcgdex.net/v2/ja';
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

/** Full card detail from TCGdex (EN or JP) - used for sort metadata. */
export interface TcgdexCardDetail {
  id: string;
  localId: string;
  name: string;
  rarity?: string;
  category?: string; // Pokemon | Trainer | Energy
  dexId?: number[];
  hp?: number;
  types?: string[];
  stage?: string;
  image?: string;
  set?: { id: string; name: string };
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
      `${TCGDEX_EN}/sets`,
      'TCGdex /sets',
    );
    if (!res) return [];

    const data: TcgdexSetListItem[] = await res.json();

    // The list endpoint doesn't include serie or releaseDate,
    // so we fetch each set's detail for the full info.
    const sets: PtcgSet[] = [];
    for (const item of data) {
      const detailRes = await this.fetchWithRetry(
        `${TCGDEX_EN}/sets/${item.id}`,
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
    const res = await this.fetchWithRetry(`${TCGDEX_EN}/sets`, 'TCGdex /sets (logos)');
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
      `${TCGDEX_EN}/cards/${cardId}`,
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
   * When preferredVariant is provided, tries that variant first before falling
   * back to the default order (normal > holofoil > reverseHolofoil > 1stEdition).
   */
  extractMarketPrice(
    pricing: TcgdexPricing | null,
    preferredVariant?: string | null,
  ): { price: number; currency: string; variant: string } | null {
    if (!pricing) return null;

    // Map slab variant strings to TCGdex pricing keys
    const VARIANT_MAP: Record<string, string> = {
      'holo': 'holofoil',
      'holofoil': 'holofoil',
      'reverse holo': 'reverseHolofoil',
      'reverse holofoil': 'reverseHolofoil',
      '1st edition holo': '1stEditionHolofoil',
      '1st edition holofoil': '1stEditionHolofoil',
      '1st edition': '1stEditionNormal',
      'normal': 'normal',
    };

    if (pricing.tcgplayer) {
      // Collect all variant entries dynamically (keys vary: "holofoil", "unlimited-holofoil", "1st-edition-holofoil", etc.)
      const skipKeys = new Set(['updated', 'unit']);
      const allVariants: [string, TcgdexVariantPrices][] = [];
      for (const [key, val] of Object.entries(pricing.tcgplayer)) {
        if (skipKeys.has(key) || !val || typeof val !== 'object') continue;
        allVariants.push([key, val as TcgdexVariantPrices]);
      }

      // Try preferred variant first (fuzzy match against all keys)
      if (preferredVariant) {
        const mapped = VARIANT_MAP[preferredVariant.toLowerCase()] ?? preferredVariant.toLowerCase();
        // Match by exact key or substring (e.g. "holofoil" matches "unlimited-holofoil")
        const preferred = allVariants.find(([k]) => k === mapped || k.includes(mapped) || mapped.includes(k));
        if (preferred) {
          const [vKey, data] = preferred;
          if (data.marketPrice && data.marketPrice > 0) {
            return { price: Math.round(data.marketPrice * 100) / 100, currency: 'USD', variant: vKey };
          }
          if (data.midPrice && data.midPrice > 0) {
            return { price: Math.round(data.midPrice * 100) / 100, currency: 'USD', variant: vKey };
          }
        }
      }

      // Fallback: best marketPrice across all variants
      for (const [variant, data] of allVariants) {
        if (data.marketPrice && data.marketPrice > 0) {
          return { price: Math.round(data.marketPrice * 100) / 100, currency: 'USD', variant };
        }
      }

      // Fallback: best midPrice across all variants
      for (const [variant, data] of allVariants) {
        if (data.midPrice && data.midPrice > 0) {
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
      `${TCGDEX_EN}/sets/${setId}`,
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

  // -- TCGdex JP methods (for sort metadata) --

  /** List all JP sets from TCGdex. */
  async getJpSets(): Promise<TcgdexSetListItem[]> {
    const res = await this.fetchWithRetry(`${TCGDEX_JP}/sets`, 'TCGdex JP /sets');
    if (!res) return [];
    return res.json();
  }

  /** Get JP set detail including card list. */
  async getJpSetDetail(setId: string): Promise<TcgdexSetDetail | null> {
    const res = await this.fetchWithRetry(
      `${TCGDEX_JP}/sets/${setId}`,
      `TCGdex JP /sets/${setId}`,
    );
    if (!res) return null;
    return res.json();
  }

  /**
   * Fetch full card detail from TCGdex (tries EN first, then JP).
   * Returns dexId, rarity, types, etc. for sort metadata.
   */
  async getCardDetail(cardId: string): Promise<TcgdexCardDetail | null> {
    // Try EN first (has more data like English names)
    const enRes = await this.fetchWithRetry(
      `${TCGDEX_EN}/cards/${cardId}`,
      `TCGdex EN /cards/${cardId}`,
    );
    if (enRes) {
      const data = await enRes.json();
      if (data?.id) return data as TcgdexCardDetail;
    }

    // Fallback to JP
    const jpRes = await this.fetchWithRetry(
      `${TCGDEX_JP}/cards/${cardId}`,
      `TCGdex JP /cards/${cardId}`,
    );
    if (!jpRes) return null;
    const data = await jpRes.json();
    return data?.id ? (data as TcgdexCardDetail) : null;
  }

  /**
   * Search for a card by name on TCGdex EN.
   * Returns sort metadata (dexId, rarity, types).
   */
  async searchCardMetadata(
    cardName: string,
    setName?: string,
    cardNumber?: string,
  ): Promise<{ dexId: number | null; rarity: string | null; cardType: string | null } | null> {
    const query = encodeURIComponent(cardName);
    const res = await this.fetchWithRetry(
      `${TCGDEX_EN}/cards?name=${query}`,
      `TCGdex search "${cardName}"`,
    );
    if (!res) return null;

    const cards: { id: string; localId: string; name: string; set?: { name: string } }[] = await res.json();
    if (!cards || cards.length === 0) return null;

    // Find best match by set name and/or card number
    let match = cards[0];
    if (setName) {
      const setLower = setName.toLowerCase();
      const bySet = cards.find((c) => c.set?.name?.toLowerCase() === setLower);
      if (bySet) match = bySet;
    }
    if (cardNumber) {
      const byNum = cards.find(
        (c) => c.localId === cardNumber && (!setName || c.set?.name?.toLowerCase() === setName.toLowerCase()),
      );
      if (byNum) match = byNum;
    }

    // Fetch full detail for the matched card
    const detail = await this.getCardDetail(match.id);
    if (!detail) return null;

    return {
      dexId: detail.dexId?.[0] ?? null,
      rarity: detail.rarity ?? null,
      cardType: detail.types?.[0] ?? null,
    };
  }
}

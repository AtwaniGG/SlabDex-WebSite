import { Injectable, Logger } from '@nestjs/common';

const RAPIDAPI_HOST = 'pokemon-tcg-api.p.rapidapi.com';
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

export interface PokemonApiCard {
  id: number;
  name: string;
  name_numbered: string;
  card_number: string;
  rarity: string;
  prices: {
    cardmarket?: {
      currency: string;
      lowest_near_mint?: number;
      '30d_average'?: number;
      '7d_average'?: number;
      graded?: {
        psa?: Record<string, number>; // { psa10: 279, psa9: 184 }
        cgc?: Record<string, number>; // { cgc10: 344 }
        bgs?: Record<string, number>;
        [key: string]: Record<string, number> | undefined;
      };
    };
    tcg_player?: {
      currency: string;
      market_price?: number;
      mid_price?: number;
    };
  };
  episode?: {
    name: string;
    code: string;
  };
  image?: string;
}

interface PokemonApiSearchResponse {
  data: PokemonApiCard[];
  total?: number;
  page?: number;
}

@Injectable()
export class PokemonApiService {
  private readonly logger = new Logger(PokemonApiService.name);
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '';
    if (!this.apiKey) {
      this.logger.warn(
        'RAPIDAPI_KEY not set — Pokemon-API.com graded pricing will be unavailable',
      );
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for cards by name and optionally set name.
   * Returns up to 20 results from the API.
   */
  async searchCards(
    cardName: string,
    setName?: string,
  ): Promise<PokemonApiCard[]> {
    if (!this.apiKey) return [];

    const query = setName
      ? `${cardName} ${setName}`
      : cardName;

    const url = `${RAPIDAPI_BASE}/cards?search=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      });

      if (res.status === 429) {
        this.logger.warn('Pokemon-API rate limit reached (100/day)');
        return [];
      }

      if (!res.ok) {
        this.logger.warn(`Pokemon-API search failed: HTTP ${res.status}`);
        return [];
      }

      const data: PokemonApiSearchResponse = await res.json();
      return data.data ?? [];
    } catch (e) {
      this.logger.error(`Pokemon-API search error: ${e}`);
      return [];
    }
  }

  /**
   * Extract the graded price for a specific grader + grade from a card result.
   * Returns the price in the currency provided (EUR from Cardmarket).
   */
  extractGradedPrice(
    card: PokemonApiCard,
    grader: string,
    grade: string,
  ): { price: number; currency: string; source: string } | null {
    const graded = card.prices?.cardmarket?.graded;
    if (!graded) return null;

    const graderKey = grader.toLowerCase(); // psa, cgc, bgs
    const graderPrices = graded[graderKey];
    if (!graderPrices) return null;

    // Try exact grade match: "psa10", "psa9", "cgc10", etc.
    const gradeNum = Math.round(parseFloat(grade));
    if (isNaN(gradeNum)) return null;

    const key = `${graderKey}${gradeNum}`;
    const price = graderPrices[key];
    if (price && price > 0) {
      // Cardmarket prices are EUR, convert to approximate USD (1 EUR ≈ 1.08 USD)
      const usdPrice = Math.round(price * 1.08 * 100) / 100;
      return {
        price: usdPrice,
        currency: 'USD',
        source: `pokemon-api:cardmarket:${key}`,
      };
    }

    return null;
  }

  /**
   * Extract raw (ungraded) market price from the card.
   * Uses TCGPlayer USD first, then Cardmarket EUR converted.
   */
  extractRawPrice(
    card: PokemonApiCard,
  ): { price: number; currency: string } | null {
    const tcg = card.prices?.tcg_player;
    if (tcg?.market_price && tcg.market_price > 0) {
      return { price: tcg.market_price, currency: 'USD' };
    }
    if (tcg?.mid_price && tcg.mid_price > 0) {
      return { price: tcg.mid_price, currency: 'USD' };
    }

    const cm = card.prices?.cardmarket;
    if (cm) {
      const eur = cm['30d_average'] ?? cm['7d_average'] ?? cm.lowest_near_mint;
      if (eur && eur > 0) {
        return { price: Math.round(eur * 1.08 * 100) / 100, currency: 'USD' };
      }
    }

    return null;
  }

  /**
   * Find the best matching card from search results by comparing card name and set.
   */
  findBestMatch(
    results: PokemonApiCard[],
    cardName: string,
    setName?: string,
    cardNumber?: string,
  ): PokemonApiCard | null {
    if (results.length === 0) return null;

    const normalizedName = cardName.toLowerCase().trim();
    const normalizedSet = setName?.toLowerCase().trim();

    // Exact name match + set match
    for (const card of results) {
      const cName = card.name?.toLowerCase().trim();
      const cSet = card.episode?.name?.toLowerCase().trim();

      if (cName === normalizedName && normalizedSet && cSet === normalizedSet) {
        return card;
      }
    }

    // Try card number + set match
    if (cardNumber && normalizedSet) {
      for (const card of results) {
        const cNum = card.card_number?.toLowerCase().trim();
        const cSet = card.episode?.name?.toLowerCase().trim();
        if (cNum === cardNumber.toLowerCase().trim() && cSet === normalizedSet) {
          return card;
        }
      }
    }

    // Partial name match + set match
    for (const card of results) {
      const cName = card.name?.toLowerCase().trim() ?? '';
      const cSet = card.episode?.name?.toLowerCase().trim();

      if (
        normalizedSet &&
        cSet === normalizedSet &&
        (cName.includes(normalizedName) || normalizedName.includes(cName))
      ) {
        return card;
      }
    }

    // If only one result, use it
    if (results.length === 1) return results[0];

    return null;
  }
}

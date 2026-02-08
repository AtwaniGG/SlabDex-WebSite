import { Injectable, Logger } from '@nestjs/common';

const API_BASE = 'https://www.pokemonpricetracker.com';

export interface PriceTrackerSmartPrice {
  price: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  daysUsed: number;
}

export interface PriceTrackerEbayGrade {
  count?: number;
  averagePrice?: number;
  medianPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  smartMarketPrice?: PriceTrackerSmartPrice;
}

export interface PriceTrackerCard {
  name?: string;
  setName?: string;
  cardNumber?: string;
  tcgPlayerId?: string;
  prices?: {
    market?: number;
    low?: number;
  };
  ebay?: {
    salesByGrade?: {
      [key: string]: PriceTrackerEbayGrade | undefined;
    };
    totalSales?: number;
  };
}

export interface PriceTrackerResponse {
  data?: PriceTrackerCard[];
  metadata?: { total?: number; count?: number };
}

@Injectable()
export class PriceTrackerService {
  private readonly logger = new Logger(PriceTrackerService.name);
  private dailyRemaining: number | null = null;

  private get apiKey(): string {
    return process.env.POKEMON_PRICE_TRACKER_API_KEY || '';
  }

  get creditsRemaining(): number | null {
    return this.dailyRemaining;
  }

  /**
   * Returns null on rate limit (429) so caller can distinguish from empty results.
   */
  async searchCards(query: string, includeEbay = false): Promise<PriceTrackerCard[] | null> {
    if (!this.apiKey) {
      this.logger.warn('POKEMON_PRICE_TRACKER_API_KEY not set');
      return [];
    }

    try {
      const url = new URL(`${API_BASE}/api/v2/cards`);
      url.searchParams.set('search', query);
      if (includeEbay) url.searchParams.set('includeEbay', 'true');
      url.searchParams.set('limit', '5');

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      // Track remaining credits from response headers
      const remaining = res.headers.get('x-ratelimit-daily-remaining');
      if (remaining) {
        this.dailyRemaining = parseInt(remaining, 10);
      }

      if (res.status === 429) {
        return null; // Signal rate limit to caller
      }

      if (!res.ok) {
        this.logger.error(`PriceTracker error: ${res.status} ${res.statusText}`);
        return [];
      }

      const body: PriceTrackerResponse = await res.json();
      return body.data ?? (Array.isArray(body) ? body : []);
    } catch (e) {
      this.logger.error(`PriceTracker fetch failed: ${e}`);
      return [];
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';

const API_BASE = 'https://api.justtcg.com/v1';

export interface JustTcgVariant {
  id: string;
  condition: string;
  printing: string;
  price: number;
  lastUpdated: number;
}

export interface JustTcgCard {
  id: string;
  name: string;
  game: string;
  set: string;
  set_name: string;
  variants: JustTcgVariant[];
}

export interface JustTcgSet {
  id: string;
  name: string;
  game_id: string;
  cards_count: number;
  release_date: string | null;
  set_value_usd: number | null;
}

@Injectable()
export class JustTcgService {
  private readonly logger = new Logger(JustTcgService.name);

  private get apiKey(): string {
    return process.env.JUSTTCG_API_KEY || '';
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Search for a card's pricing. Returns best Near Mint price.
   * game: 'pokemon' for EN, 'pokemon-japan' for JP.
   */
  async searchCard(
    cardName: string,
    setName?: string,
    game: 'pokemon' | 'pokemon-japan' = 'pokemon',
  ): Promise<JustTcgCard[] | null> {
    if (!this.apiKey) return [];

    try {
      const url = new URL(`${API_BASE}/cards`);
      const q = setName ? `${cardName} ${setName}` : cardName;
      url.searchParams.set('q', q);
      url.searchParams.set('game', game);

      const res = await fetch(url.toString(), {
        headers: { 'x-api-key': this.apiKey },
      });

      if (res.status === 429) {
        this.logger.warn('JustTCG rate limited');
        return null;
      }

      if (!res.ok) {
        this.logger.error(`JustTCG error: ${res.status} ${res.statusText}`);
        return [];
      }

      const body = await res.json();
      return body.data ?? [];
    } catch (e) {
      this.logger.error(`JustTCG fetch failed: ${e}`);
      return [];
    }
  }

  /**
   * Batch lookup cards by POST.
   * Each item needs at least a card identifier (name/tcgplayerId).
   */
  async batchGetPrices(
    cards: { name: string; set?: string }[],
  ): Promise<JustTcgCard[]> {
    if (!this.apiKey || cards.length === 0) return [];

    try {
      const res = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          cards.map((c) => ({
            q: c.set ? `${c.name} ${c.set}` : c.name,
            game: 'pokemon',
          })),
        ),
      });

      if (!res.ok) {
        this.logger.error(`JustTCG batch error: ${res.status}`);
        return [];
      }

      const body = await res.json();
      return body.data ?? [];
    } catch (e) {
      this.logger.error(`JustTCG batch failed: ${e}`);
      return [];
    }
  }

  /**
   * Get all Pokemon sets (EN or JP).
   */
  async getSets(
    game: 'pokemon' | 'pokemon-japan' = 'pokemon',
  ): Promise<JustTcgSet[]> {
    if (!this.apiKey) return [];

    try {
      const url = new URL(`${API_BASE}/sets`);
      url.searchParams.set('game', game);

      const res = await fetch(url.toString(), {
        headers: { 'x-api-key': this.apiKey },
      });

      if (!res.ok) {
        this.logger.error(`JustTCG sets error: ${res.status}`);
        return [];
      }

      const body = await res.json();
      return body.data ?? [];
    } catch (e) {
      this.logger.error(`JustTCG sets failed: ${e}`);
      return [];
    }
  }

  /**
   * Extract the best Near Mint price from a JustTCG card result.
   */
  extractPrice(card: JustTcgCard): number | null {
    if (!card.variants || card.variants.length === 0) return null;

    // Prefer Near Mint Normal
    const nm = card.variants.find(
      (v) => v.condition === 'Near Mint' && v.printing === 'Normal',
    );
    if (nm && nm.price > 0) return nm.price;

    // Any Near Mint
    const anyNm = card.variants.find(
      (v) => v.condition === 'Near Mint' && v.price > 0,
    );
    if (anyNm) return anyNm.price;

    // Any variant with a price
    const anyPrice = card.variants.find((v) => v.price > 0);
    return anyPrice?.price ?? null;
  }
}

import { Injectable, Logger } from '@nestjs/common';

const POKEMON_TCG_BASE = 'https://api.pokemontcg.io/v2';
const PAGE_SIZE = 250;
const DELAY_MS = 1100; // 1.1s between paginated requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5s backoff on failure

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

interface PtcgSetsResponse {
  data: PtcgSet[];
  totalCount: number;
}

interface PtcgCardsResponse {
  data: PtcgCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
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
      `${POKEMON_TCG_BASE}/sets?pageSize=500&orderBy=releaseDate`,
      'Pokemon TCG /sets',
    );
    if (!res) return [];

    const data: PtcgSetsResponse = await res.json();
    return data.data;
  }

  async getCardsForSet(setId: string): Promise<PtcgCard[]> {
    const allCards: PtcgCard[] = [];
    let page = 1;
    let totalCount = Infinity;

    while ((page - 1) * PAGE_SIZE < totalCount) {
      const res = await this.fetchWithRetry(
        `${POKEMON_TCG_BASE}/cards?q=set.id:${setId}&pageSize=${PAGE_SIZE}&page=${page}`,
        `Pokemon TCG /cards set=${setId} page ${page}`,
      );
      if (!res) break;

      const data: PtcgCardsResponse = await res.json();
      totalCount = data.totalCount;

      if (data.data.length === 0) break;
      allCards.push(...data.data);
      page++;

      if ((page - 1) * PAGE_SIZE < totalCount) {
        await sleep(DELAY_MS);
      }
    }

    return allCards;
  }
}

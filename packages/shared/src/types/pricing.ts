export type PriceConfidence = 'high' | 'medium' | 'low';

export type PriceSource = 'alt' | 'tcgdex' | 'price_tracker';

export interface Price {
  id: string;
  slabId: string;
  source: PriceSource;
  marketPrice: number;
  currency: string;
  confidence: PriceConfidence;
  retrievedAt: Date;
  rawResponse: Record<string, unknown> | null;
}

export interface PriceSnapshotDaily {
  slabId: string;
  date: string;
  marketPrice: number;
}

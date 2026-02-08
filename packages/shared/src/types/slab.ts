export type Platform = 'courtyard' | 'beezie' | 'phygitals';

export type SlabParseStatus = 'ok' | 'partial' | 'fail';

export interface Slab {
  id: string;
  assetRawId: string;
  platform: Platform;
  certNumber: string | null;
  grader: string | null;
  grade: string | null;
  setName: string | null;
  cardName: string | null;
  cardNumber: string | null;
  variant: string | null;
  imageUrl: string | null;
  fingerprintText: string | null;
  parseStatus: SlabParseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlabWithPrice extends Slab {
  marketPrice: number | null;
  priceCurrency: string | null;
  priceRetrievedAt: Date | null;
}

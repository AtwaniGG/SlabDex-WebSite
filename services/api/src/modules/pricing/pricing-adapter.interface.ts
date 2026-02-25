export interface PricingAdapter {
  getPriceByCert(certNumber: string): Promise<{
    priceUsd: number | null;
    retrievedAt: Date;
  }>;
}

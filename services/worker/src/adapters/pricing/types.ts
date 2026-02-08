export interface PriceResult {
  price: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  raw: Record<string, unknown>;
  retrievedAt: Date;
}

export interface PricingAdapter {
  getPriceByCert(certNumber: string): Promise<PriceResult | null>;
}

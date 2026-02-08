import { PricingAdapter, PriceResult } from './types';

/**
 * ALT.xyz pricing adapter.
 * Fetches market price for a slab using its certificate number.
 *
 * TODO: Implement when ALT.xyz API key and documentation are available.
 */
export class AltPricingAdapter implements PricingAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ALT_API_KEY || '';
    this.baseUrl = process.env.ALT_API_BASE_URL || '';
  }

  async getPriceByCert(certNumber: string): Promise<PriceResult | null> {
    console.log(`[AltAdapter] Fetching price for cert ${certNumber}`);

    if (!this.apiKey || !this.baseUrl) {
      console.warn('[AltAdapter] API key or base URL not configured, skipping price fetch');
      return null;
    }

    // TODO: Implement real API call
    // const response = await fetch(`${this.baseUrl}/prices/${certNumber}`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
    // });
    // const data = await response.json();
    // return { price: data.price, currency: 'USD', confidence: 'high', raw: data, retrievedAt: new Date() };

    return null;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PricingAdapter } from './pricing-adapter.interface';

@Injectable()
export class AltAdapter implements PricingAdapter {
  private readonly logger = new Logger(AltAdapter.name);

  // TODO: Replace with real ALT API base URL
  // private readonly baseUrl = process.env.ALT_API_URL ?? 'https://api.alt.xyz/v1';
  // private readonly apiKey = process.env.ALT_API_KEY ?? '';

  async getPriceByCert(certNumber: string): Promise<{
    priceUsd: number | null;
    retrievedAt: Date;
  }> {
    this.logger.debug(`Looking up cert: ${certNumber}`);

    // TODO: Replace stub with real ALT API call
    // const response = await fetch(`${this.baseUrl}/certs/${certNumber}/price`, {
    //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
    // });
    // const data = await response.json();
    // return { priceUsd: data.price ?? null, retrievedAt: new Date() };

    // Stub: return mock price based on cert number hash for deterministic results
    const hash = [...certNumber].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const mockPrice = Math.round(((hash % 500) + 5) * 100) / 100;

    return {
      priceUsd: mockPrice,
      retrievedAt: new Date(),
    };
  }
}

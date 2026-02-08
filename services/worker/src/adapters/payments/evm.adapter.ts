import { PaymentsAdapter, PaymentVerification } from './types';

/**
 * EVM payments adapter for Ethereum and Polygon.
 * Placeholder for Milestone 4.
 */
export class EvmPaymentsAdapter implements PaymentsAdapter {
  constructor(private chain: 'ethereum' | 'polygon') {}

  async generateReceiveAddress(_invoiceId: string): Promise<string> {
    // TODO: Derive from HD wallet
    throw new Error('Not implemented');
  }

  async verifyPayment(_receiveAddress: string, _requiredAmount: string): Promise<PaymentVerification> {
    // TODO: Check on-chain via RPC
    throw new Error('Not implemented');
  }

  async getNativePrice(): Promise<number> {
    // TODO: Chainlink oracle or CoinGecko fallback
    throw new Error('Not implemented');
  }
}

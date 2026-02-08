import { PaymentsAdapter, PaymentVerification } from './types';

/**
 * Solana payments adapter.
 * Placeholder for Milestone 4.
 */
export class SolanaPaymentsAdapter implements PaymentsAdapter {
  async generateReceiveAddress(_invoiceId: string): Promise<string> {
    // TODO: Generate unique Solana keypair per invoice
    throw new Error('Not implemented');
  }

  async verifyPayment(_receiveAddress: string, _requiredAmount: string): Promise<PaymentVerification> {
    // TODO: Check Solana RPC for transfer
    throw new Error('Not implemented');
  }

  async getNativePrice(): Promise<number> {
    // TODO: Pyth SOL/USD oracle
    throw new Error('Not implemented');
  }
}

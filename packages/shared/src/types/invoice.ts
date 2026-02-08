export type Chain = 'ethereum' | 'polygon' | 'solana';

export type InvoiceStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface Invoice {
  id: string;
  userId: string;
  usdAmount: number;
  chain: Chain;
  requiredAmountNative: string;
  receiveAddress: string;
  status: InvoiceStatus;
  txHash: string | null;
  expiresAt: Date;
  createdAt: Date;
  paidAt: Date | null;
}

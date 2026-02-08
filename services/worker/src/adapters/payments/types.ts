export interface PaymentVerification {
  isPaid: boolean;
  txHash: string | null;
  amount: string | null;
  confirmations: number;
}

export interface PaymentsAdapter {
  generateReceiveAddress(invoiceId: string): Promise<string>;
  verifyPayment(receiveAddress: string, requiredAmount: string): Promise<PaymentVerification>;
  getNativePrice(): Promise<number>; // USD price of native token
}

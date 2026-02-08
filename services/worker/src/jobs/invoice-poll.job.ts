import { Job } from 'bullmq';

export interface InvoicePollPayload {
  invoiceId: string;
  chain: string;
  receiveAddress: string;
  requiredAmountNative: string;
}

export default async function invoicePollJob(job: Job<InvoicePollPayload>) {
  const { invoiceId, chain } = job.data;
  console.log(`Polling invoice ${invoiceId} on ${chain}`);

  // Placeholder for Milestone 4
  // 1. Check on-chain for payment to receiveAddress
  // 2. If paid: update invoice status, create subscription period
  // 3. If expired: mark invoice as expired
}

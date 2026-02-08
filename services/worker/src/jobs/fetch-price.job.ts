import { Job } from 'bullmq';

export interface FetchPricePayload {
  slabId: string;
  certNumber: string;
}

export default async function fetchPriceJob(job: Job<FetchPricePayload>) {
  const { slabId, certNumber } = job.data;
  console.log(`Fetching price for slab ${slabId} (cert: ${certNumber})`);

  // TODO: Implement when ALT.xyz API is available
  // 1. Call PricingAdapter.getPriceByCert(certNumber)
  // 2. Insert price record
  // 3. Update cache TTL
}

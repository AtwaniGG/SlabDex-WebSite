import { Job } from 'bullmq';

export interface ComputeSetProgressPayload {
  trackedAddressId: string;
  ownerAddress: string;
}

export default async function computeSetProgressJob(job: Job<ComputeSetProgressPayload>) {
  const { trackedAddressId, ownerAddress } = job.data;
  console.log(`Computing set progress for address ${ownerAddress}`);

  // TODO: Wire to Prisma
  // 1. Group slabs by set_name for owner
  // 2. Look up set_references for total cards
  // 3. Upsert set_progress records
}

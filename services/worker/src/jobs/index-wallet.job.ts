import { Job } from 'bullmq';

export interface IndexWalletPayload {
  ownerAddress: string;
  contractAddress: string;
  platform: string;
}

export default async function indexWalletJob(job: Job<IndexWalletPayload>) {
  const { ownerAddress, contractAddress, platform } = job.data;
  console.log(`Indexing wallet ${ownerAddress} on ${platform} (contract: ${contractAddress})`);

  // TODO: Implement when Courtyard contract address is known
  // 1. Call OwnershipAdapter.listNftsByOwner(ownerAddress, contractAddress)
  // 2. Upsert each NFT into assets_raw
  // 3. Queue parseMetadata jobs for new/updated assets
  // 4. Queue priceFetch jobs for parsed slabs
}

export interface AssetRaw {
  id: string;
  chain: string;
  contractAddress: string;
  tokenId: string;
  ownerAddress: string;
  tokenUri: string | null;
  rawMetadata: Record<string, unknown> | null;
  lastIndexedAt: Date;
  createdAt: Date;
}

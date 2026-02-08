export interface OwnedNft {
  contractAddress: string;
  tokenId: string;
  tokenUri: string | null;
  metadata: Record<string, unknown> | null;
}

export interface OwnershipAdapter {
  listNftsByOwner(owner: string, contractAddress: string): Promise<OwnedNft[]>;
}

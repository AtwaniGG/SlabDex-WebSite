import { OwnershipAdapter, OwnedNft } from './types';

const ALCHEMY_POLYGON_BASE = 'https://polygon-mainnet.g.alchemy.com/nft/v3';

interface AlchemyNft {
  contract: { address: string };
  tokenId: string;
  tokenUri?: string;
  name?: string;
  description?: string;
  image?: { cachedUrl?: string; originalUrl?: string };
  raw?: {
    metadata?: Record<string, unknown>;
    tokenUri?: string;
  };
}

interface AlchemyResponse {
  ownedNfts: AlchemyNft[];
  pageKey?: string;
  totalCount: number;
}

/**
 * Courtyard ownership adapter using Alchemy NFT API (Polygon).
 * Fetches all ERC-721 NFTs owned by an address for the Courtyard contract.
 */
export class CourtyardOwnershipAdapter implements OwnershipAdapter {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALCHEMY_API_KEY || '';
  }

  async listNftsByOwner(owner: string, contractAddress: string): Promise<OwnedNft[]> {
    if (!this.apiKey) {
      console.warn('[CourtyardAdapter] ALCHEMY_API_KEY not set, returning empty');
      return [];
    }

    const allNfts: OwnedNft[] = [];
    let pageKey: string | undefined;

    do {
      const url = new URL(`${ALCHEMY_POLYGON_BASE}/${this.apiKey}/getNFTsForOwner`);
      url.searchParams.set('owner', owner);
      url.searchParams.set('contractAddresses[]', contractAddress);
      url.searchParams.set('withMetadata', 'true');
      url.searchParams.set('pageSize', '100');
      if (pageKey) url.searchParams.set('pageKey', pageKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`[CourtyardAdapter] Alchemy error: ${response.status} ${response.statusText}`);
        break;
      }

      const data: AlchemyResponse = await response.json();

      for (const nft of data.ownedNfts) {
        allNfts.push({
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          tokenUri: nft.raw?.tokenUri || nft.tokenUri || null,
          metadata: nft.raw?.metadata || null,
        });
      }

      pageKey = data.pageKey;
      console.log(`[CourtyardAdapter] Fetched ${allNfts.length}/${data.totalCount} NFTs for ${owner}`);
    } while (pageKey);

    return allNfts;
  }
}

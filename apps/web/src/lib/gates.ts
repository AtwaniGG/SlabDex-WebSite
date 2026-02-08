import { FREE_ACTIVE_ADDRESSES, PREMIUM_TRACKED_ADDRESSES } from '@pokedex-slabs/shared';

export type Tier = 'free' | 'premium';

export function getMaxAddresses(tier: Tier): number {
  return tier === 'premium' ? PREMIUM_TRACKED_ADDRESSES : FREE_ACTIVE_ADDRESSES;
}

export function canRefreshPrice(tier: Tier, lastRefreshed: Date | null): boolean {
  if (!lastRefreshed) return true;
  const cooldownMs = tier === 'premium' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return Date.now() - lastRefreshed.getTime() > cooldownMs;
}

export function isPremiumFeature(feature: string): boolean {
  const premiumFeatures = [
    'price_history',
    'alerts',
    'export',
    'showcase',
    'multi_address',
    'auto_refresh',
  ];
  return premiumFeatures.includes(feature);
}

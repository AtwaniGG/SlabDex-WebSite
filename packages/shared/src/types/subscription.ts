export type Plan = 'free' | 'premium';

export type SubscriptionStatus = 'inactive' | 'active' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPeriod {
  id: string;
  userId: string;
  startAt: Date;
  endAt: Date;
  sourceInvoiceId: string;
}

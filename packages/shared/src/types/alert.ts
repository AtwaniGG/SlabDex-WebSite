export type AlertType = 'price_move' | 'milestone';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  rule: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  triggeredAt: Date;
  payload: Record<string, unknown>;
}

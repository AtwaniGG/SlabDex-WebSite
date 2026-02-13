export interface SetReference {
  setName: string;
  totalCards: number;
  releaseYear: number | null;
  generation: string | null;
  logoUrl: string | null;
  symbolUrl: string | null;
}

export interface SetProgress {
  id: string;
  trackedAddressId: string;
  setName: string;
  ownedCount: number;
  totalCards: number;
  completionPct: number;
  updatedAt: Date;
}

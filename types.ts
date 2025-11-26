export interface EnvelopeData {
  id: number;
  amount: number;
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
}

export interface Donor {
  name: string;
  amount: number;
  claimedAt: string;
}

export type Tier = '1-10' | '11-25' | '26-50' | '51-75' | '76-100' | '101-127' | 'ALL';

export interface StorageData {
  envelopes: Record<number, EnvelopeData>;
  donors: Donor[];
}

export interface SuggestionCardProps {
  title: string;
  description: string;
  targetId: number;
  onClick: (id: number) => void;
}

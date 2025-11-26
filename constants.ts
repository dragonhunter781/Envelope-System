import { TierConfig } from './types';

export const CONFIG = {
  CAMPAIGN_NAME: "matching-donation-campaign",
  END_DATE: "2025-11-29T23:59:59",
  GOAL_AMOUNT: 8128,
  MATCH_MULTIPLIER: 2,
  TOTAL_ENVELOPES: 127,
  // SUPABASE KEYS (Public/Anon)
  SUPABASE_URL: "https://kextsgnywbflvxadzawn.supabase.co", 
  SUPABASE_KEY: "sb_publishable_cGWZggP4-OfADkGO5fso_Q_bq5wrPS3"
};

// INLINE CSS COLORS (No Tailwind classes)
export const TIERS: TierConfig[] = [
  { 
    label: '1-10', 
    min: 1, 
    max: 10, 
    background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', // Emerald
    solid: '#10b981'
  },
  { 
    label: '11-25', 
    min: 11, 
    max: 25, 
    background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', // Teal
    solid: '#14b8a6'
  },
  { 
    label: '26-50', 
    min: 26, 
    max: 50, 
    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', // Sky
    solid: '#0ea5e9'
  },
  { 
    label: '51-75', 
    min: 51, 
    max: 75, 
    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', // Violet
    solid: '#8b5cf6'
  },
  { 
    label: '76-100', 
    min: 76, 
    max: 100, 
    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', // Amber
    solid: '#f59e0b'
  },
  { 
    label: '101-127', 
    min: 101, 
    max: 127, 
    background: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', // Rose
    solid: '#f43f5e'
  },
];

export const getTierForAmount = (amount: number) => {
  return TIERS.find(t => amount >= t.min && amount <= t.max) || TIERS[TIERS.length - 1];
};
import { Tier } from './types';

export const CONFIG = {
  CAMPAIGN_NAME: "matching-donation-campaign",
  DONORBOX_URL: "https://donorbox.org/matching-donation-campaign", // Placeholder
  END_DATE: "2025-11-29T23:59:59",
  GOAL_AMOUNT: 8128,
  MATCH_MULTIPLIER: 2,
  TOTAL_ENVELOPES: 127,
  // PASTE YOUR KEYS HERE
  // IMPORTANT: Use the "anon" / "public" key. Do NOT use the service_role (secret) key.
  SUPABASE_URL: "https://kextsgnywbflvxadzawn.supabase.co", 
  SUPABASE_KEY: "sb_publishable_cGWZggP4-OfADkGO5fso_Q_bq5wrPS3"
};

export const TIERS: { label: Tier; min: number; max: number; gradient: string; shadow: string }[] = [
  { label: '1-10', min: 1, max: 10, gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  { label: '11-25', min: 11, max: 25, gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/20' },
  { label: '26-50', min: 26, max: 50, gradient: 'from-sky-400 to-sky-600', shadow: 'shadow-sky-500/20' },
  { label: '51-75', min: 51, max: 75, gradient: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/20' },
  { label: '76-100', min: 76, max: 100, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20' },
  { label: '101-127', min: 101, max: 127, gradient: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/20' },
];

export const getTierForAmount = (amount: number) => {
  return TIERS.find(t => amount >= t.min && amount <= t.max) || TIERS[TIERS.length - 1];
};
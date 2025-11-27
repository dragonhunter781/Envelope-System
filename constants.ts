import { Tier } from './types';

export const CONFIG = {
  CAMPAIGN_NAME: "matching-donation-campaign",
  DONORBOX_URL: "https://donorbox.org/matching-donation-campaign",
  END_DATE: "2025-11-29T23:59:59",
  GOAL_AMOUNT: 8128,
  MATCH_MULTIPLIER: 2,
  TOTAL_ENVELOPES: 127,
  // PASTE YOUR KEYS HERE
  SUPABASE_URL: "https://kextsgnywbflvxadzawn.supabase.co", 
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleHRzZ255d2JmbHZ4YWR6YXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDg5OTEsImV4cCI6MjA3OTY4NDk5MX0.wDuOVbJOOLVSPI7UFSzGMdp6qdi5FssR9Rk32v3tPgA"
};

// Using inline HEX gradients to ensure compatibility and avoid Tailwind JIT issues with dynamic classes
export const TIERS: { label: Tier; min: number; max: number; gradient: string; solid: string }[] = [
  { 
    label: '1-10', 
    min: 1, 
    max: 10, 
    gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', // emerald-400 to 600
    solid: '#10b981' 
  },
  { 
    label: '11-25', 
    min: 11, 
    max: 25, 
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', // teal-400 to 600
    solid: '#14b8a6'
  },
  { 
    label: '26-50', 
    min: 26, 
    max: 50, 
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', // sky-400 to 600
    solid: '#0ea5e9'
  },
  { 
    label: '51-75', 
    min: 51, 
    max: 75, 
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', // violet-400 to 600
    solid: '#8b5cf6'
  },
  { 
    label: '76-100', 
    min: 76, 
    max: 100, 
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', // amber-400 to 600
    solid: '#f59e0b'
  },
  { 
    label: '101-127', 
    min: 101, 
    max: 127, 
    gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', // rose-400 to 600
    solid: '#f43f5e'
  },
];

export const getTierForAmount = (amount: number) => {
  return TIERS.find(t => amount >= t.min && amount <= t.max) || TIERS[TIERS.length - 1];
};
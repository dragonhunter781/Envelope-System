import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StorageData, EnvelopeData } from "../types";
import { CONFIG } from "../constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Storage Helpers
const STORAGE_KEY = 'envelope_challenge_data_v2';

export const getInitialData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Robust checks
      if (!parsed.envelopes || typeof parsed.envelopes !== 'object') {
        throw new Error("Invalid envelope data");
      }
      return {
        envelopes: parsed.envelopes,
        donors: Array.isArray(parsed.donors) ? parsed.donors : []
      };
    }
  } catch (error) {
    console.warn("Resetting storage:", error);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Default Init
  const envelopes: Record<number, EnvelopeData> = {};
  for (let i = 1; i <= CONFIG.TOTAL_ENVELOPES; i++) {
    envelopes[i] = { id: i, amount: i, isClaimed: false };
  }

  const initialData = { envelopes, donors: [] };
  saveToStorage(initialData);
  return initialData;
};

export const saveToStorage = (data: StorageData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage save failed", e);
  }
};
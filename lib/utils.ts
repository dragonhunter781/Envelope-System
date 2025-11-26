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
// Updated to v2 to flush old cache (removes Holland family locally after DB delete)
const STORAGE_KEY = 'envelope_challenge_data_v2';

export const getInitialData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Robust Check: Ensure 'envelopes' exists and has keys. 
      // If the data structure is malformed (e.g. from an old version), rebuild it but try to keep donors.
      if (!parsed.envelopes || Object.keys(parsed.envelopes).length === 0) {
        throw new Error("Invalid envelope data structure");
      }

      // Ensure 'donors' is always an array
      const donors = Array.isArray(parsed.donors) ? parsed.donors : [];

      return {
        envelopes: parsed.envelopes,
        donors: donors
      };
    }
  } catch (error) {
    console.warn("Could not load/parse local storage, resetting to default:", error);
    // Remove corrupted data to prevent persistent crashes
    localStorage.removeItem(STORAGE_KEY);
  }

  // Initialize Default State
  const envelopes: Record<number, EnvelopeData> = {};
  for (let i = 1; i <= CONFIG.TOTAL_ENVELOPES; i++) {
    envelopes[i] = {
      id: i,
      amount: i,
      isClaimed: false,
    };
  }

  const initialData = {
    envelopes,
    donors: [],
  };
  
  // Persist the initial state immediately so it exists on next load
  saveToStorage(initialData);
  
  return initialData;
};

export const saveToStorage = (data: StorageData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
};
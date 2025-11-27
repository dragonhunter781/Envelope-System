import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants';
import { StorageData, EnvelopeData, Donor } from '../types';

// Initialize Supabase Client
// We use a simple check to see if the key has been updated from the default placeholder
const isConfigured = CONFIG.SUPABASE_KEY && !CONFIG.SUPABASE_KEY.includes("YOUR_SUPABASE");

export const supabase = isConfigured
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
  : null;

// Log connection status for debugging
if (supabase) {
  console.log('✅ Supabase configured:', CONFIG.SUPABASE_URL);
} else {
  console.warn('⚠️ Supabase NOT configured - donations will only be stored locally');
}

// Service to sync data
export const db = {
  async fetchAll(): Promise<Partial<StorageData>> {
    if (!supabase) return {};

    try {
      // Fetch Envelopes - Explicitly requesting range 0-1000 to ensure we get all 127
      // (Supabase sometimes defaults to 100 without this)
      const { data: envData, error: envError } = await supabase
        .from('envelopes')
        .select('*')
        .order('id', { ascending: true })
        .range(0, 1000);
      
      if (envError) throw envError;

      // Fetch Donors
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .order('claimed_at', { ascending: false })
        .range(0, 1000);

      console.log('📊 Supabase donors fetch:', { donorData, donorError });

      if (donorError) throw donorError;

      // Transform to App format
      const envelopes: Record<number, EnvelopeData> = {};
      envData?.forEach((row: any) => {
        envelopes[row.id] = {
          id: row.id,
          amount: row.amount,
          isClaimed: row.is_claimed,
          claimedBy: row.claimed_by,
          claimedAt: row.claimed_at
        };
      });

      // Get donors from donors table
      const donorsFromTable: Donor[] = donorData?.map((row: any) => ({
        name: row.name,
        amount: row.amount,
        claimedAt: row.claimed_at
      })) || [];

      // Also extract donors from claimed envelopes (in case they didn't complete the donors table entry)
      const donorsFromEnvelopes: Donor[] = [];
      const donorMap = new Map<string, { amount: number; claimedAt: string }>();

      // Group envelope claims by donor name to get total amount per person
      envData?.forEach((row: any) => {
        if (row.is_claimed && row.claimed_by) {
          const existing = donorMap.get(row.claimed_by);
          if (existing) {
            existing.amount += row.amount;
            // Keep the most recent claimed_at
            if (row.claimed_at > existing.claimedAt) {
              existing.claimedAt = row.claimed_at;
            }
          } else {
            donorMap.set(row.claimed_by, {
              amount: row.amount,
              claimedAt: row.claimed_at || new Date().toISOString()
            });
          }
        }
      });

      // Convert map to array
      donorMap.forEach((value, name) => {
        donorsFromEnvelopes.push({
          name,
          amount: value.amount,
          claimedAt: value.claimedAt
        });
      });

      // Merge donors: prefer donors table data, but include envelope-only donors
      const donorNames = new Set(donorsFromTable.map(d => d.name));
      const mergedDonors = [
        ...donorsFromTable,
        ...donorsFromEnvelopes.filter(d => !donorNames.has(d.name))
      ].sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());

      console.log('📊 Donors from table:', donorsFromTable.length);
      console.log('📊 Donors from envelopes:', donorsFromEnvelopes.length);
      console.log('📊 Merged donors:', mergedDonors);

      return { envelopes, donors: mergedDonors };

    } catch (error) {
      console.error("Supabase Fetch Error:", error);
      return {};
    }
  },

  async claimEnvelopes(ids: number[], name: string, email: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const timestamp = new Date().toISOString();

      // 1. Update Envelopes Table
      const { error: updateError } = await supabase
        .from('envelopes')
        .update({
          is_claimed: true,
          claimed_by: name,
          claimed_at: timestamp
        })
        .in('id', ids);

      if (updateError) throw updateError;

      // 2. Insert into Donors Table (including email for verification)
      const totalAmount = ids.reduce((sum, id) => sum + id, 0); // Amount = ID in this challenge

      const { error: insertError } = await supabase
        .from('donors')
        .insert({
          name: name,
          email: email,
          amount: totalAmount,
          claimed_at: timestamp
        });

      if (insertError) throw insertError;

      // Store email in localStorage for future verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('donor_email', email);
        localStorage.setItem('donor_name', name);
        localStorage.setItem('donor_amount', totalAmount.toString());
      }

      return true;
    } catch (error) {
      console.error("Supabase Claim Error:", error);
      return false;
    }
  },

  // Check if email exists in donors table (returns donor info if found)
  async checkDonorByEmail(email: string): Promise<{ name: string; amount: number } | null> {
    if (!supabase || !email) return null;

    try {
      const { data, error } = await supabase
        .from('donors')
        .select('name, amount')
        .eq('email', email.toLowerCase().trim())
        .order('claimed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return { name: data.name, amount: data.amount };
    } catch (error) {
      console.error("Supabase Donor Check Error:", error);
      return null;
    }
  },

  // Real-time Subscription
  subscribe(
    onEnvelopeUpdate: (envelope: EnvelopeData) => void,
    onNewDonor: (donor: Donor) => void
  ) {
    if (!supabase) return () => {};

    const channel = supabase.channel('realtime_donations')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'envelopes' },
        (payload: any) => {
          const newEnv = payload.new;
          onEnvelopeUpdate({
            id: newEnv.id,
            amount: newEnv.amount,
            isClaimed: newEnv.is_claimed,
            claimedBy: newEnv.claimed_by,
            claimedAt: newEnv.claimed_at
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donors' },
        (payload: any) => {
          const newDonor = payload.new;
          onNewDonor({
            name: newDonor.name,
            amount: newDonor.amount,
            claimedAt: newDonor.claimed_at
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
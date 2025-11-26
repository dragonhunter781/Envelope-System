import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants';
import { StorageData, EnvelopeData, Donor } from '../types';

// Initialize Supabase Client
// We use a simple check to see if the key has been updated from the default placeholder
const isConfigured = CONFIG.SUPABASE_KEY && !CONFIG.SUPABASE_KEY.includes("YOUR_SUPABASE");

export const supabase = isConfigured 
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
  : null;

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

      const donors: Donor[] = donorData?.map((row: any) => ({
        name: row.name,
        amount: row.amount,
        claimedAt: row.claimed_at
      })) || [];

      return { envelopes, donors };

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

      // 2. Insert into Donors Table
      const totalAmount = ids.reduce((sum, id) => sum + id, 0); // Amount = ID in this challenge

      const { error: insertError } = await supabase
        .from('donors')
        .insert({
          name: name,
          amount: totalAmount,
          claimed_at: timestamp
        });

      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error("Supabase Claim Error:", error);
      return false;
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
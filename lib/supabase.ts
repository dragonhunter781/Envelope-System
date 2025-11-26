import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants';
import { StorageData, EnvelopeData, Donor } from '../types';

const isConfigured = CONFIG.SUPABASE_KEY && !CONFIG.SUPABASE_KEY.includes("YOUR_SUPABASE");

export const supabase = isConfigured 
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
  : null;

export const db = {
  async fetchAll(): Promise<Partial<StorageData>> {
    if (!supabase) return {};

    try {
      // Range 0-1000 ensures we get all 127 items
      const { data: envData, error: envError } = await supabase
        .from('envelopes')
        .select('*')
        .order('id', { ascending: true })
        .range(0, 1000);
      
      if (envError) throw envError;

      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .order('claimed_at', { ascending: false })
        .range(0, 1000);

      if (donorError) throw donorError;

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
      console.error("Supabase Error:", error);
      return {};
    }
  },

  async claimEnvelopes(ids: number[], name: string, email: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const timestamp = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('envelopes')
        .update({
          is_claimed: true,
          claimed_by: name,
          claimed_at: timestamp
        })
        .in('id', ids);

      if (updateError) throw updateError;

      // Sum of IDs is the amount logic for this specific challenge
      const totalAmount = ids.reduce((sum, id) => sum + id, 0);

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
      console.error("Claim Error:", error);
      return false;
    }
  },

  subscribe(
    onEnvelopeUpdate: (envelope: EnvelopeData) => void,
    onNewDonor: (donor: Donor) => void
  ) {
    if (!supabase) return () => {};

    const channel = supabase.channel('realtime_donations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'envelopes' }, (payload: any) => {
          onEnvelopeUpdate({
            id: payload.new.id,
            amount: payload.new.amount,
            isClaimed: payload.new.is_claimed,
            claimedBy: payload.new.claimed_by,
            claimedAt: payload.new.claimed_at
          });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donors' }, (payload: any) => {
          onNewDonor({
            name: payload.new.name,
            amount: payload.new.amount,
            claimedAt: payload.new.claimed_at
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
};
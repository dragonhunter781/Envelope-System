import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeData, Tier } from '../types';
import { TIERS } from '../constants';
import { cn } from '../lib/utils';
import { Envelope3D } from './Envelope3D';

interface EnvelopeGridProps {
  envelopes: EnvelopeData[];
  selectedIds: number[];
  filter: Tier;
  isCampaignComplete: boolean;
  onToggle: (env: EnvelopeData) => void;
}

export const EnvelopeGrid: React.FC<EnvelopeGridProps> = ({ envelopes, selectedIds, filter, isCampaignComplete, onToggle }) => {
  
  const filteredEnvelopes = React.useMemo(() => {
    if (filter === 'ALL') return envelopes;
    const tier = TIERS.find(t => t.label === filter);
    if (!tier) return envelopes;
    return envelopes.filter(e => e.amount >= tier.min && e.amount <= tier.max);
  }, [envelopes, filter]);

  return (
    <div className="grid grid-cols-3 gap-3 pb-32">
      <AnimatePresence mode="popLayout">
        {filteredEnvelopes.map((env) => {
          const isSelected = selectedIds.includes(env.id);
          return (
            <motion.div
              layoutId={`envelope-${env.id}`}
              key={env.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={!env.isClaimed && !isCampaignComplete ? { scale: 0.95 } : {}}
              className={cn(
                "relative group rounded-lg",
                env.isClaimed ? "cursor-default" : "cursor-pointer",
                isCampaignComplete ? "opacity-80" : "",
                isSelected && "ring-4 ring-slate-900 ring-offset-2 z-10 rounded-lg"
              )}
              onClick={() => onToggle(env)}
            >
              <Envelope3D 
                amount={env.amount} 
                isClaimed={env.isClaimed} 
                isOpen={false} 
              />
              
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md z-30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
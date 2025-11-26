import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnvelopeData } from '../types';
import { CONFIG } from '../constants';
import { Button, Input } from './ui/CoreComponents';
import { cn, formatCurrency } from '../lib/utils';
import { Envelope3D } from './Envelope3D';

interface DonationOverlayProps {
  envelope: EnvelopeData;
  onClose: () => void;
  onClaim: (name: string, email: string) => void;
}

export const DonationOverlay: React.FC<DonationOverlayProps> = ({ envelope, onClose, onClaim }) => {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Envelope animation sequence
    setTimeout(() => setIsOpen(true), 300);
  }, []);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName) return;
    setStep('payment');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-slate-900/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Mobile Safe Container specifically for the modal content */}
      <div className="w-full max-w-[420px] h-full relative bg-white flex flex-col overflow-hidden shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Animation Area */}
        <div className="relative h-48 bg-slate-50 flex items-center justify-center shrink-0 border-b border-slate-100">
           <motion.div 
             className="w-40"
             animate={{ 
               y: step === 'payment' ? -200 : 0,
               opacity: step === 'payment' ? 0 : 1 
             }}
           >
             <Envelope3D amount={envelope.amount} isOpen={isOpen} />
           </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
           {step === 'details' ? (
             <form onSubmit={handleDetailsSubmit} className="space-y-6 pt-2">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 mb-1">{formatCurrency(envelope.amount)}</h2>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    Becomes {formatCurrency(envelope.amount * CONFIG.MATCH_MULTIPLIER)} with match!
                  </p>
                </div>

                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Donor Name</label>
                     <Input 
                        required 
                        placeholder="e.g. The Smith Family" 
                        value={donorName} 
                        onChange={e => setDonorName(e.target.value)} 
                      />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                     <Input 
                        required 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                      />
                   </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                  Proceed to Donation
                </Button>
                
                <p className="text-[10px] text-center text-slate-400">
                  Your donation is 501(c)(3) tax-deductible.
                </p>
             </form>
           ) : (
             <div className="flex flex-col h-full">
                <div className="flex-1 bg-white min-h-[400px] border border-slate-100 rounded-lg overflow-hidden relative mb-4">
                  <iframe 
                    src={`https://donorbox.org/embed/matching-donation-campaign?amount=${envelope.amount}&hide_donation_meter=true`}
                    name="donorbox"
                    frameBorder="0"
                    scrolling="no"
                    allow="payment"
                    className="w-full h-full absolute inset-0"
                    style={{ minWidth: '250px', maxHeight: 'none' }}
                  />
                </div>
                <Button 
                   onClick={() => onClaim(donorName, email)} 
                   className="w-full h-14 bg-slate-900 text-white font-bold shrink-0 mb-4"
                >
                  I've Completed My Donation
                </Button>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};
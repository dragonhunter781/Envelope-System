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
  const [animationStage, setAnimationStage] = useState<0 | 1 | 2 | 3>(0);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Reset state when envelope changes
    setAnimationStage(0);
    setStep('details');
    setDonorName('');
    setEmail('');

    // Start Animation Sequence
    const t1 = setTimeout(() => setAnimationStage(1), 300); // Select/Zoom
    const t2 = setTimeout(() => setAnimationStage(2), 900); // Open Flap
    const t3 = setTimeout(() => setAnimationStage(3), 1600); // Slide Content & Expand

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [envelope.id]); // Re-run only if envelope ID changes

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName) return;
    setStep('payment');
  };

  const handlePaymentComplete = () => {
    onClaim(donorName, email);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full md:max-w-lg h-full md:h-[650px] flex items-center justify-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100/80 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors backdrop-blur-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* The Envelope Container */}
        <motion.div
          className="relative w-64 md:w-80 z-20 pointer-events-none"
          initial={{ scale: 0.5, y: 100, opacity: 0 }}
          animate={{ 
            scale: animationStage >= 3 ? 0.5 : 1.2, 
            y: animationStage >= 3 ? -100 : 0,
            opacity: animationStage >= 3 ? 0 : 1
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Envelope3D 
              amount={envelope.amount} 
              isOpen={animationStage >= 2} 
              showContent={false}
              className="shadow-2xl"
            />
        </motion.div>

        {/* The Letter / Form Container */}
        <motion.div
            className="absolute z-10 w-full md:max-w-md h-full md:h-auto md:rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col items-center border-t md:border border-slate-100"
            initial={{ y: 0, height: 10, width: '60%', opacity: 0, borderRadius: '0.75rem' }}
            animate={{ 
              y: animationStage >= 2 ? (animationStage === 3 ? 0 : -100) : 0,
              height: animationStage === 3 ? (step === 'payment' ? '100%' : 'auto') : 200,
              width: animationStage === 3 ? '100%' : '60%',
              opacity: animationStage >= 2 ? 1 : 0,
              borderRadius: animationStage === 3 && window.innerWidth < 768 ? '0' : '0.75rem'
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{
              maxHeight: animationStage === 3 ? '100%' : '200px',
              top: animationStage === 3 && window.innerWidth < 768 ? 0 : 'auto',
              bottom: animationStage === 3 && window.innerWidth < 768 ? 0 : 'auto'
            }}
        >
          {/* Paper Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 pointer-events-none"></div>

          <div className="relative w-full h-full flex flex-col text-slate-800">
              
              {/* Header Content - Only show in Details step to save space for widget */}
              <motion.div 
                className="text-center px-4 pt-12 pb-4 md:p-8 md:pb-4 w-full"
                animate={{ 
                  opacity: step === 'payment' ? 1 : 1,
                  paddingBottom: step === 'payment' ? 0 : '1rem' 
                }}
              >
                <h2 className={cn("font-black text-slate-900 tracking-tighter transition-all", step === 'payment' ? "text-2xl md:text-3xl" : "text-5xl md:text-6xl mb-2")}>
                  {formatCurrency(envelope.amount)}
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-widest">
                  Becomes {formatCurrency(envelope.amount * CONFIG.MATCH_MULTIPLIER)} with match!
                </p>
              </motion.div>

              <div className="w-full border-b border-slate-100 mb-4" />

              {/* Content Area */}
              <motion.div
                className="flex-1 w-full flex flex-col px-4 md:px-8 pb-8 overflow-y-auto no-scrollbar"
                initial={{ opacity: 0 }}
                animate={{ opacity: animationStage === 3 ? 1 : 0 }}
                transition={{ delay: 0.2 }}
              >
                {animationStage === 3 && (
                  <>
                    {step === 'details' ? (
                      <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-safe">
                        <p className="text-center text-slate-500 font-medium text-sm mb-2 md:mb-4">
                          Complete your donation to claim envelope #{envelope.id}.
                        </p>

                        <form onSubmit={handleDetailsSubmit} className="space-y-4 md:space-y-5">
                          {/* Locked Amount Display */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Donation Amount</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                <Input 
                                  type="text"
                                  value={envelope.amount}
                                  readOnly
                                  className="bg-slate-50 border-slate-200 text-slate-800 pl-7 h-11 font-bold text-lg cursor-not-allowed focus-visible:ring-0 focus-visible:border-slate-200 shadow-none"
                                />
                                <div className="absolute right-3 top-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wide">
                                    <span>Locked</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name for Donor Wall</label>
                            <Input 
                              required
                              placeholder="e.g. The Smith Family" 
                              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (for receipt)</label>
                            <Input 
                              required
                              type="email"
                              placeholder="you@example.com" 
                              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>

                          <div className="pt-4 pb-4">
                              <Button 
                                type="submit" 
                                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/20 rounded-xl transform transition-all active:scale-[0.98]"
                              >
                                Proceed to Payment
                              </Button>
                              <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                                <span>🔒</span> Your donation is tax-deductible.
                              </p>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500 pb-4">
                        <div className="flex-1 bg-white min-h-[300px] md:min-h-[400px] rounded-lg overflow-hidden border border-slate-100 mb-4 relative">
                            {/* Donorbox Iframe */}
                            <iframe 
                              src={`https://donorbox.org/embed/matching-donation-campaign?amount=${envelope.amount}&hide_donation_meter=true`} 
                              name="donorbox" 
                              frameBorder="0" 
                              scrolling="no" 
                              className="w-full h-full"
                              style={{ maxHeight: 'none' }}
                              title="Donation Form"
                            />
                        </div>
                        <Button 
                            onClick={handlePaymentComplete}
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shrink-0"
                        >
                            I've Completed My Donation
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 mt-2 pb-2 leading-tight">
                           E3 Partners is a recognized 501(c)(3) nonprofit organization. Your donation is tax-deductible to the extent allowed by law.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
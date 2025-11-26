import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeData, Donor, Tier, StorageData } from './types';
import { CONFIG, TIERS, getTierForAmount } from './constants';
import { getInitialData, saveToStorage, formatCurrency, cn } from './lib/utils';
import { db } from './lib/supabase';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Badge } from './components/ui/CoreComponents';
import { Envelope3D } from './components/Envelope3D';
import { DonationOverlay } from './components/DonationOverlay';
import { ShareModal } from './components/ShareModal';
// import { DebugOverlay } from './components/DebugOverlay';

declare global {
  interface Window {
    confetti: any;
  }
}

// Enhanced confetti burst for desktop
const fireConfetti = () => {
  if (!window.confetti) return;

  // Center burst
  window.confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
  });

  // Side cannons for desktop
  if (window.innerWidth > 768) {
    setTimeout(() => {
      window.confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      window.confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ec4899', '#8b5cf6', '#10b981']
      });
    }, 150);

    // Extra sparkle burst
    setTimeout(() => {
      window.confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.3 },
        colors: ['#ffd700', '#ffec8b', '#fff8dc']
      });
    }, 300);
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<StorageData>(getInitialData());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [donatingEnvelope, setDonatingEnvelope] = useState<EnvelopeData | null>(null);
  const [shareData, setShareData] = useState<{ amount: number, name: string } | null>(null);
  const [filter, setFilter] = useState<Tier>('ALL');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [verifiedDonor, setVerifiedDonor] = useState<{ name: string; amount: number } | null>(null);

  // Recalculate totals immediately based on data state
  const envelopes = Object.values(data.envelopes) as EnvelopeData[];
  const totalRaised = envelopes.reduce((sum, env) => env.isClaimed ? sum + env.amount : sum, 0);
  const totalImpact = totalRaised * CONFIG.MATCH_MULTIPLIER;
  const progressPercent = Math.min((totalRaised / CONFIG.GOAL_AMOUNT) * 100, 100);
  const claimedCount = envelopes.filter(e => e.isClaimed).length;
  const isCampaignComplete = claimedCount >= CONFIG.TOTAL_ENVELOPES;

  const filteredEnvelopes = useMemo(() => {
    if (filter === 'ALL') return envelopes;
    const tier = TIERS.find(t => t.label === filter);
    if (!tier) return envelopes;
    return envelopes.filter(e => e.amount >= tier.min && e.amount <= tier.max);
  }, [envelopes, filter]);

  const recentDonors = [...data.donors].sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()).slice(0, 10);
  const selectedTotal = selectedIds.reduce((sum, id) => sum + (data.envelopes[id]?.amount || 0), 0);
  const selectedCount = selectedIds.length;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = +new Date(CONFIG.END_DATE) - +new Date();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  // Check if user is a verified donor (from localStorage)
  useEffect(() => {
    const checkDonorStatus = async () => {
      const storedEmail = localStorage.getItem('donor_email');
      const storedName = localStorage.getItem('donor_name');
      const storedAmount = localStorage.getItem('donor_amount');

      if (storedEmail && storedName && storedAmount) {
        // User has donated before - verify with Supabase
        const verified = await db.checkDonorByEmail(storedEmail);
        if (verified) {
          setVerifiedDonor(verified);
        } else {
          // Fallback to localStorage data if Supabase check fails
          setVerifiedDonor({ name: storedName, amount: parseInt(storedAmount, 10) });
        }
      }
    };
    checkDonorStatus();
  }, []);

  // Sync Logic
  useEffect(() => {
    const syncData = async () => {
      // 1. Fetch remote data
      const remoteData = await db.fetchAll();
      
      if (remoteData.envelopes) {
        setData(prev => {
          // Merge remote state with local structure
          const mergedEnvelopes = { ...prev.envelopes };
          Object.values(remoteData.envelopes!).forEach(remoteEnv => {
            if (mergedEnvelopes[remoteEnv.id]) {
              mergedEnvelopes[remoteEnv.id] = {
                ...mergedEnvelopes[remoteEnv.id],
                isClaimed: remoteEnv.isClaimed,
                claimedBy: remoteEnv.claimedBy,
                claimedAt: remoteEnv.claimedAt
              };
            }
          });
          const newData = { envelopes: mergedEnvelopes, donors: remoteData.donors || prev.donors };
          saveToStorage(newData);
          return newData;
        });
      }
    };
    
    // Initial Sync
    syncData();

    // 2. Subscribe to Realtime Changes
    const unsubscribe = db.subscribe(
      (updatedEnvelope) => {
        setData(prev => {
           const mergedEnvelopes = { ...prev.envelopes };
           if (mergedEnvelopes[updatedEnvelope.id]) {
             mergedEnvelopes[updatedEnvelope.id] = {
               ...mergedEnvelopes[updatedEnvelope.id],
               isClaimed: updatedEnvelope.isClaimed,
               claimedBy: updatedEnvelope.claimedBy,
               claimedAt: updatedEnvelope.claimedAt
             };
           }
           const newData = { ...prev, envelopes: mergedEnvelopes };
           saveToStorage(newData);
           return newData;
        });
        if (updatedEnvelope.isClaimed) {
          setSelectedIds(prev => prev.filter(id => id !== updatedEnvelope.id));
        }
      },
      (newDonor) => {
        setData(prev => {
           const exists = prev.donors.some(d => d.claimedAt === newDonor.claimedAt && d.name === newDonor.name);
           if (exists) return prev;
           const newData = { ...prev, donors: [newDonor, ...prev.donors] };
           saveToStorage(newData);
           return newData;
        });
      }
    );
    return () => { unsubscribe(); }
  }, []);

  useEffect(() => {
    if (isCampaignComplete) {
      setShowCompletionModal(true);
      if (window.confetti) {
        // ... (Confetti logic)
      }
    }
  }, [isCampaignComplete]);

  const handleEnvelopeToggle = (env: EnvelopeData) => {
    if (env.isClaimed || isCampaignComplete) return;
    setSelectedIds(prev => prev.includes(env.id) ? prev.filter(id => id !== env.id) : [...prev, env.id]);
  };

  const handleProceedToDonate = () => {
    if (selectedCount === 0) return;
    const combinedEnvelope: EnvelopeData = { id: 0, amount: selectedTotal, isClaimed: false };
    setDonatingEnvelope(combinedEnvelope);
  };

  const handleClaim = async (name: string, email: string) => {
    if (!donatingEnvelope) return;
    const currentAmount = donatingEnvelope.amount;
    const idsToClaim = [...selectedIds];
    
    // Optimistic UI Update
    const newEnvelopes = { ...data.envelopes };
    idsToClaim.forEach(id => {
      if (newEnvelopes[id]) {
        newEnvelopes[id] = { ...newEnvelopes[id], isClaimed: true, claimedBy: name, claimedAt: new Date().toISOString() };
      }
    });
    const newDonors = [{ name, amount: currentAmount, claimedAt: new Date().toISOString() }, ...data.donors];
    const newData = { envelopes: newEnvelopes, donors: newDonors };
    setData(newData);
    saveToStorage(newData);
    
    setDonatingEnvelope(null);
    setSelectedIds([]);

    // Set verified donor status immediately after donation
    setVerifiedDonor({ name, amount: currentAmount });

    // Fire enhanced confetti celebration
    if (!isCampaignComplete) {
      fireConfetti();
    }
    setShareData({ amount: currentAmount, name });
    await db.claimEnvelopes(idsToClaim, name, email);
  };

  // Allow verified donors to share their impact
  const handleShareExisting = useCallback(() => {
    if (verifiedDonor) {
      setShareData({ amount: verifiedDonor.amount, name: verifiedDonor.name });
      fireConfetti();
    }
  }, [verifiedDonor]);

  return (
    <div className="w-full max-w-[420px] lg:max-w-none mx-auto min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 overflow-x-hidden lg:shadow-none lg:border-x-0 shadow-2xl border-x border-slate-100/50">

      {/* Sticky Header */}
      <div
        className="fixed top-0 left-0 right-0 z-40 mx-auto max-w-[420px] lg:max-w-none bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
        style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="px-5 lg:px-12 xl:px-20 py-3 lg:py-4 flex items-center justify-between">
           <div className="flex items-center gap-2 lg:gap-3">
              <span className="text-xl lg:text-3xl">💌</span>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-sky-500">
                  The 127 Challenge
                </h1>
                <p className="hidden lg:block text-xs text-slate-500">Double your impact with matched donations</p>
              </div>
           </div>
           <div className="flex items-center gap-3 lg:gap-4">
             {/* Desktop: Show countdown in header */}
             <div className="hidden lg:flex items-center gap-2 text-sm">
               <span className="text-slate-500">Ends in:</span>
               <span className="font-mono font-bold text-slate-900">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
             </div>
             <Badge variant="gradient" className="text-[10px] lg:text-xs px-2 lg:px-3 py-0.5 lg:py-1">
               {isCampaignComplete ? "GOAL REACHED!" : "2X MATCH"}
             </Badge>
           </div>
        </div>
      </div>

      <main className="px-5 lg:px-12 xl:px-20 mt-20 lg:mt-24 space-y-6">

        {/* Desktop: Two-column layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">

          {/* Left Column - Progress & Info (Desktop) / Full width (Mobile) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Progress Section */}
            <section className="space-y-4">
               <Card className="border-slate-200 bg-white shadow-sm overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60" />
                 <CardContent className="p-5 lg:p-6 relative">
                    <div className="flex justify-between items-baseline mb-2">
                       <span className="text-sm lg:text-base font-bold text-slate-700">Campaign Progress</span>
                       <div className="text-right">
                          <span className="text-emerald-600 font-black font-mono text-lg lg:text-xl">{formatCurrency(totalRaised)}</span>
                          <span className="text-slate-400 text-xs font-medium ml-1">/ {formatCurrency(CONFIG.GOAL_AMOUNT)}</span>
                       </div>
                    </div>
                    <Progress value={progressPercent} className="h-4 lg:h-5 mb-2" />
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>{claimedCount}/127 claimed</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                 </CardContent>
               </Card>

               {/* BBB Info - Updated messaging */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
               >
                 <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-xl overflow-hidden relative">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-sky-500/10 animate-pulse" />

                    <CardContent className="p-5 lg:p-6 relative">
                      <div className="flex gap-4">
                        <motion.span
                          className="text-3xl lg:text-4xl"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          🤝
                        </motion.span>
                        <div className="space-y-2">
                          <h3 className="font-black text-emerald-400 text-base lg:text-lg">Together, We Can Double Every Gift!</h3>
                          <p className="text-sm lg:text-base text-slate-200 leading-relaxed">
                            <span className="font-bold text-white">E3 Partners</span> has joined forces with <span className="font-bold text-white">Businesses Beyond Borders</span> to create a matching fund that <span className="text-emerald-400 font-semibold">doubles every donation</span>.
                          </p>
                          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mt-3">
                            <p className="text-sm text-amber-200 font-medium flex items-center gap-2">
                              <span className="text-lg">⏰</span>
                              <span>Only <strong className="text-white">{timeLeft.days} days</strong> left! We need your help to reach our goal.</span>
                            </p>
                          </div>
                          <p className="text-sm text-slate-300 mt-2">
                            🙏 Please pray about partnering with us in this mission.
                          </p>
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            Every gift is tax-deductible (501c3)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                 </Card>
               </motion.div>

               {/* Share Button for Verified Donors Only */}
               {verifiedDonor && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.4 }}
                 >
                   <Card className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-none shadow-lg overflow-hidden">
                     <CardContent className="p-4 lg:p-5">
                       <div className="flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3">
                           <span className="text-2xl">🎉</span>
                           <div>
                             <p className="font-bold text-sm lg:text-base">Welcome back, {verifiedDonor.name}!</p>
                             <p className="text-xs lg:text-sm text-white/80">Share your {formatCurrency(verifiedDonor.amount)} gift with friends!</p>
                           </div>
                         </div>
                         <Button
                           onClick={handleShareExisting}
                           className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-4 lg:px-6 h-10 lg:h-12 rounded-full shadow-lg"
                         >
                           Share Now
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               )}

               {/* Stats Grid - Mobile only, desktop shows in header */}
               <div className="grid grid-cols-2 gap-3 lg:hidden">
                 <Card className="bg-white p-3 text-center">
                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Deadline</p>
                    <p className="text-lg font-black text-slate-900 font-mono leading-none">{timeLeft.days}d {timeLeft.hours}h</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeLeft.minutes}m {timeLeft.seconds}s</p>
                 </Card>
                 <Card className="bg-white p-3 text-center flex flex-col justify-center">
                     <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Latest Hero</p>
                     <p className="text-sm font-bold text-slate-800 truncate px-1">{recentDonors[0]?.name || "None"}</p>
                     <p className="text-xs font-mono text-emerald-600">{recentDonors[0] ? formatCurrency(recentDonors[0].amount) : "-"}</p>
                 </Card>
               </div>

               {/* Recent Heroes - Desktop sidebar */}
               <div className="hidden lg:block">
                 <Card className="bg-white border-slate-200">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-bold text-slate-900">Recent Heroes</CardTitle>
                   </CardHeader>
                   <CardContent className="pt-0">
                     <div className="divide-y divide-slate-100">
                       {recentDonors.length === 0 ? (
                         <div className="py-3 text-center text-xs text-slate-400">Be the first to donate!</div>
                       ) : (
                         recentDonors.slice(0, 5).map((d, i) => {
                           const tier = getTierForAmount(d.amount);
                           return (
                             <div key={i} className="flex justify-between items-center py-2 text-sm">
                               <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.solid }} />
                                 <span className="font-medium text-slate-700 truncate max-w-[120px]">{d.name}</span>
                               </div>
                               <span className="font-mono font-bold text-emerald-600 text-xs">{formatCurrency(d.amount)}</span>
                             </div>
                           );
                         })
                       )}
                     </div>
                   </CardContent>
                 </Card>
               </div>
            </section>
          </div>

          {/* Right Column - Envelopes (Desktop) / Full width (Mobile) */}
          <div className="lg:col-span-8 mt-6 lg:mt-0">

        {/* Filter Section */}
        <section className="sticky top-[64px] lg:top-[80px] z-30 bg-slate-50/95 py-2 -mx-5 px-5 lg:mx-0 lg:px-0 lg:rounded-lg overflow-hidden">
           <div className="overflow-x-auto no-scrollbar flex gap-2 pb-2 lg:flex-wrap">
             <button
                onClick={() => setFilter('ALL')}
                className={cn(
                  "px-4 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-bold whitespace-nowrap transition-all border",
                  filter === 'ALL' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                )}
              >
                View All
              </button>
             {TIERS.map((tier) => (
               <button
                  key={tier.label}
                  onClick={() => setFilter(tier.label)}
                  className={cn(
                    "px-4 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-bold whitespace-nowrap transition-all border",
                    filter === tier.label ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  )}
                >
                  ${tier.min}-{tier.max}
                </button>
             ))}
           </div>
        </section>

        {/* Envelope Grid - Responsive columns */}
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredEnvelopes.map((env) => {
              const isSelected = selectedIds.includes(env.id);
              return (
                <motion.div
                  layoutId={`envelope-${env.id}`}
                  key={env.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={!env.isClaimed && !isCampaignComplete ? { scale: 0.95 } : {}}
                  className={cn(
                    "relative rounded-lg",
                    env.isClaimed ? "cursor-default" : "cursor-pointer",
                    isSelected && "ring-2 ring-offset-2 ring-slate-900 z-10"
                  )}
                  onClick={() => handleEnvelopeToggle(env)}
                >
                  <Envelope3D amount={env.amount} isClaimed={env.isClaimed} isOpen={false} />
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-md z-20">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {/* Recent Heroes List - Mobile only */}
        <section className="pt-4 pb-8 lg:hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">Recent Heroes</h3>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {recentDonors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Be the first to donate!</div>
                ) : (
                    recentDonors.map((d, i) => {
                      const tier = getTierForAmount(d.amount);
                      return (
                        <div key={i} className="flex justify-between items-center p-3 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.solid }} />
                                <span className="font-medium text-slate-700 truncate max-w-[150px]">{d.name}</span>
                            </div>
                            <span className="font-mono font-bold text-emerald-600">{formatCurrency(d.amount)}</span>
                        </div>
                      )
                    })
                )}
            </div>
        </section>

          </div>{/* End Right Column */}
        </div>{/* End Two-column layout */}
      </main>

      {/* Sticky Footer */}
      <AnimatePresence>
        {selectedCount > 0 && !isCampaignComplete && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-[420px] lg:max-w-none z-50 bg-white border-t border-slate-200 shadow-xl px-5 lg:px-12 xl:px-20 py-3 lg:py-4 safe-area-pb"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
                 <span className="text-xs lg:text-sm text-slate-500 font-bold uppercase tracking-wider">{selectedCount} Selected</span>
                 <span className="text-2xl lg:text-3xl font-black text-slate-900 leading-none">{formatCurrency(selectedTotal)}</span>
                 <span className="hidden lg:block text-sm text-emerald-600 font-semibold">→ Becomes {formatCurrency(selectedTotal * CONFIG.MATCH_MULTIPLIER)} with match!</span>
              </div>
              <Button
                onClick={handleProceedToDonate}
                className="h-12 lg:h-14 px-6 lg:px-10 text-base lg:text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg"
              >
                Donate Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      {isCampaignComplete && showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
            <Card className="w-full max-w-sm bg-white border-none shadow-2xl p-6 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">GOAL REACHED!</h2>
                <p className="text-slate-600 mb-6">All envelopes claimed! Total impact: <span className="font-bold text-emerald-600">{formatCurrency(totalImpact)}</span></p>
                <Button onClick={() => setShowCompletionModal(false)} className="w-full bg-slate-900 h-12 rounded-xl">View Heroes</Button>
            </Card>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {donatingEnvelope && (
          <DonationOverlay 
            key="overlay"
            envelope={donatingEnvelope} 
            onClose={() => setDonatingEnvelope(null)} 
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareData && (
          <ShareModal 
            key="share"
            data={shareData}
            onClose={() => setShareData(null)} 
          />
        )}
      </AnimatePresence>

      {/* Debug Overlay removed for production */}
      {/* <DebugOverlay /> */}
    </div>
  );
};

export default App;
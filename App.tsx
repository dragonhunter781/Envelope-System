import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeData, Donor, Tier, StorageData } from './types';
import { CONFIG, TIERS, getTierForAmount } from './constants';
import { getInitialData, saveToStorage, formatCurrency, cn } from './lib/utils';
import { db } from './lib/supabase';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Badge } from './components/ui/CoreComponents';
import { Envelope3D } from './components/Envelope3D';
import { DonationOverlay } from './components/DonationOverlay';
import { ShareModal } from './components/ShareModal';

// Confetti global declaration
declare global {
  interface Window {
    confetti: any;
  }
}

const App: React.FC = () => {
  // State
  // Initialize with local storage for instant render, then sync with DB
  const [data, setData] = useState<StorageData>(getInitialData());
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  const [donatingEnvelope, setDonatingEnvelope] = useState<EnvelopeData | null>(null); 
  const [shareData, setShareData] = useState<{ amount: number, name: string } | null>(null);
  const [filter, setFilter] = useState<Tier>('ALL');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({ days: 0, hours: 0, minutes: 0 });
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Derived State
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

  // Selection Logic
  const selectedTotal = selectedIds.reduce((sum, id) => sum + (data.envelopes[id]?.amount || 0), 0);
  const selectedCount = selectedIds.length;

  // Effects
  useEffect(() => {
    // Timer
    const calculateTimeLeft = () => {
      const difference = +new Date(CONFIG.END_DATE) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    calculateTimeLeft(); // Initial
    return () => clearInterval(timer);
  }, []);

  // Sync with Supabase on Mount
  useEffect(() => {
    const syncData = async () => {
      const remoteData = await db.fetchAll();
      if (remoteData.envelopes) {
        setData(prev => {
          // Merge remote envelopes with local structure to ensure we always have 1-127
          const mergedEnvelopes = { ...prev.envelopes };
          
          // Apply remote state
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
          
          const newData = {
            envelopes: mergedEnvelopes,
            donors: remoteData.donors || prev.donors
          };
          
          // Update local storage to keep it fresh
          saveToStorage(newData);
          return newData;
        });
      }
    };
    syncData();

    // Subscribe to Realtime Updates
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

        // If someone else claimed an envelope I had selected, deselect it
        if (updatedEnvelope.isClaimed) {
          setSelectedIds(prev => prev.filter(id => id !== updatedEnvelope.id));
        }
      },
      (newDonor) => {
        setData(prev => {
           // Prevent duplicates if we just added it ourselves
           const exists = prev.donors.some(d => d.claimedAt === newDonor.claimedAt && d.name === newDonor.name);
           if (exists) return prev;

           const newData = {
             ...prev,
             donors: [newDonor, ...prev.donors]
           };
           saveToStorage(newData);
           return newData;
        });
      }
    );

    return () => {
      unsubscribe();
    }
  }, []);

  // Check for campaign completion animation
  useEffect(() => {
    if (isCampaignComplete) {
      setShowCompletionModal(true);
      if (window.confetti) {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      }
    }
  }, [isCampaignComplete]);

  // Handlers
  const handleEnvelopeToggle = (env: EnvelopeData) => {
    if (env.isClaimed || isCampaignComplete) return;
    
    setSelectedIds(prev => {
      if (prev.includes(env.id)) {
        return prev.filter(id => id !== env.id);
      } else {
        return [...prev, env.id];
      }
    });
  };

  const handleProceedToDonate = () => {
    if (selectedCount === 0) return;
    
    // Create a virtual "combined" envelope for the visualization
    const combinedEnvelope: EnvelopeData = {
      id: 0, // Virtual ID
      amount: selectedTotal,
      isClaimed: false
    };
    setDonatingEnvelope(combinedEnvelope);
  };

  const handleClaim = async (name: string, email: string) => {
    if (!donatingEnvelope) return;

    const currentAmount = donatingEnvelope.amount;
    const idsToClaim = [...selectedIds];

    // Optimistic Update
    const newEnvelopes = { ...data.envelopes };
    idsToClaim.forEach(id => {
      if (newEnvelopes[id]) {
        newEnvelopes[id] = {
          ...newEnvelopes[id],
          isClaimed: true,
          claimedBy: name,
          claimedAt: new Date().toISOString()
        };
      }
    });

    const newDonors = [
      { name, amount: currentAmount, claimedAt: new Date().toISOString() },
      ...data.donors
    ];

    const newData = { envelopes: newEnvelopes, donors: newDonors };
    setData(newData);
    saveToStorage(newData);
    
    // 1. Close donation overlay and clear selection
    setDonatingEnvelope(null);
    setSelectedIds([]);

    // 2. Celebration (if not complete)
    if (!isCampaignComplete && window.confetti) {
      window.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
      });
    }

    // 3. Open Share Modal
    setShareData({ amount: currentAmount, name });

    // 4. Sync to DB
    await db.claimEnvelopes(idsToClaim, name, email);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30 pb-24 overflow-x-hidden w-full">
      
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <span className="text-2xl hidden md:block">💌</span>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-sky-500">
                  The 127 Challenge
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">Total Impact Goal: {formatCurrency(CONFIG.GOAL_AMOUNT * CONFIG.MATCH_MULTIPLIER)}</p>
              </div>
           </div>
           <Badge variant="gradient" className="animate-pulse shadow-emerald-200">
             {isCampaignComplete ? "🎉 GOAL REACHED!" : "🎁 MATCH ACTIVE (2X)"}
           </Badge>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8 md:space-y-12">

        {/* --- Hero & Stats Section --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Progress Card */}
           <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm overflow-hidden order-1">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
             <CardHeader className="relative pb-2">
               <CardTitle className="flex justify-between items-center text-xl text-slate-800">
                 <span>Campaign Progress</span>
                 <span className="text-emerald-600 font-mono">{formatCurrency(totalRaised)} / {formatCurrency(CONFIG.GOAL_AMOUNT)}</span>
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6 relative pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{claimedCount} of {CONFIG.TOTAL_ENVELOPES} claimed</span>
                    <span>{Math.round(progressPercent)}% Funded</span>
                  </div>
                  <Progress value={progressPercent} className="h-6" />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: "Your Age", icon: "🎂" },
                    { label: "Jersey #", icon: "👕" },
                    { label: "Lucky #", icon: "🍀" },
                    { label: "Day of Month", icon: "📅" }
                  ].map((s) => (
                    <div 
                      key={s.label}
                      className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <span className="text-2xl mb-1 filter grayscale opacity-80">{s.icon}</span>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{s.label}</span>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>

           {/* Side Column */}
           <div className="space-y-6 order-2">
              {/* BBB Info Card */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <h3 className="font-bold text-lg text-emerald-400">Double Your Impact</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-semibold text-white">E3 Partners</span> has decided to partner with <span className="font-semibold text-white">BBB (Businesses Beyond Borders)</span> to do a matching fund so your dollars go further. Thank you for your partnership.
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                        All contributions are 501(c)(3) tax-deductible.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 border-t border-slate-700 pt-3">
                    Pick one or multiple envelopes below. Your contribution helps unlock this matching gift instantly.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  <Card className="bg-white border-slate-200">
                    <CardContent className="p-4 md:p-6 text-center space-y-2">
                      <h3 className="text-xs md:text-sm uppercase tracking-widest text-slate-500">Time Remaining</h3>
                      <div className="text-2xl md:text-4xl font-black font-mono text-slate-900">
                        {timeLeft.days}d {timeLeft.hours}h
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-400">Ends {new Date(CONFIG.END_DATE).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                  
                   {/* Mobile Donor Wall - Summary */}
                   <Card className="flex flex-col bg-white border-slate-200 lg:hidden">
                       <CardContent className="p-4 flex items-center justify-between">
                           <div>
                               <p className="text-xs text-slate-500 font-bold uppercase">Latest Hero</p>
                               <p className="font-bold text-slate-800">{recentDonors[0]?.name || "None yet"}</p>
                           </div>
                           <Badge variant="outline" className="font-mono text-emerald-600">{recentDonors[0] ? formatCurrency(recentDonors[0].amount) : "$0"}</Badge>
                       </CardContent>
                   </Card>
              </div>

              {/* Desktop Donor Wall */}
              <Card className="hidden lg:flex max-h-[200px] flex-col bg-white border-slate-200">
                <CardHeader className="py-3 px-4 border-b border-slate-100">
                   <CardTitle className="text-sm text-slate-700">Recent Heroes</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
                   {recentDonors.length === 0 ? (
                     <div className="p-4 text-center text-sm text-slate-400">Be the first to donate!</div>
                   ) : (
                     <ul className="divide-y divide-slate-100">
                       {recentDonors.map((d, i) => (
                         <motion.li 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="flex justify-between items-center p-3 text-sm hover:bg-slate-50"
                          >
                           <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${getTierForAmount(d.amount).gradient}`} />
                             <span className="font-medium text-slate-700 truncate max-w-[120px]">{d.name}</span>
                           </div>
                           <span className="font-mono text-emerald-600 font-medium">{formatCurrency(d.amount)}</span>
                         </motion.li>
                       ))}
                     </ul>
                   )}
                </div>
              </Card>
           </div>
        </section>

        {/* --- Filters --- */}
        <section className="sticky top-[60px] md:top-[70px] z-30 py-2 -mx-4 px-4 overflow-hidden pointer-events-none">
           <div className="flex justify-start md:justify-center overflow-x-auto pb-4 pt-2 px-1 pointer-events-auto no-scrollbar">
               <div className="p-1.5 bg-white/90 backdrop-blur-lg rounded-full border border-slate-200 shadow-md flex gap-2 min-w-max">
                 {TIERS.map((tier) => {
                   const count = envelopes.filter(e => e.amount >= tier.min && e.amount <= tier.max && !e.isClaimed).length;
                   return (
                      <button
                        key={tier.label}
                        onClick={() => setFilter(tier.label)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                          filter === tier.label 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-800"
                        )}
                      >
                        {tier.label === 'ALL' ? 'All' : `$${tier.min}-${tier.max}`}
                        <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[10px]", filter === tier.label ? "bg-white/20 text-white" : "bg-white text-slate-400")}>
                          {count}
                        </span>
                      </button>
                   )
                 })}
                  <button
                    onClick={() => setFilter('ALL')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                      filter === 'ALL'
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-800"
                    )}
                  >
                    View All
                  </button>
               </div>
           </div>
        </section>

        {/* --- Grid --- */}
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredEnvelopes.map((env) => {
              const isSelected = selectedIds.includes(env.id);
              return (
                <motion.div
                  layoutId={`envelope-${env.id}`}
                  id={`envelope-${env.id}`}
                  key={env.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={!env.isClaimed && !isCampaignComplete ? { scale: 0.95 } : {}}
                  whileHover={!env.isClaimed && !isCampaignComplete ? { y: -5, scale: 1.05, zIndex: 10 } : {}}
                  className={cn(
                    "relative group rounded-lg transition-all duration-300",
                    env.isClaimed ? "cursor-default grayscale opacity-60" : "cursor-pointer",
                    isCampaignComplete ? "cursor-default opacity-80" : "",
                    isSelected && "ring-4 ring-slate-900 ring-offset-2 z-10"
                  )}
                  onClick={() => handleEnvelopeToggle(env)}
                >
                  <Envelope3D 
                    amount={env.amount} 
                    isClaimed={env.isClaimed} 
                    isOpen={false} 
                    className={cn(
                      "transition-shadow duration-300",
                      !env.isClaimed && !isSelected && !isCampaignComplete && "group-hover:shadow-xl group-hover:shadow-emerald-500/20"
                    )}
                  />
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md z-30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}

                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>
      </main>

      {/* --- Sticky Footer Action Bar --- */}
      <AnimatePresence>
        {selectedCount > 0 && !isCampaignComplete && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                 <div className="text-sm text-slate-500 font-medium">
                   {selectedCount} {selectedCount === 1 ? 'envelope' : 'envelopes'} selected
                 </div>
                 <div className="text-2xl font-black text-slate-900">
                   {formatCurrency(selectedTotal)}
                 </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-red-500 hidden sm:flex">
                  Clear
                </Button>
                <Button 
                  onClick={handleProceedToDonate} 
                  className="h-12 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                >
                  Donate Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Complete Overlay */}
      <AnimatePresence>
        {isCampaignComplete && showCompletionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
             <Card className="w-full max-w-2xl bg-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 pointer-events-none" />
                <CardHeader className="text-center pt-10 pb-2">
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", stiffness: 150 }}
                     className="text-6xl mb-4"
                   >
                     🏆
                   </motion.div>
                   <CardTitle className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">
                     WE DID IT!
                   </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 p-8">
                   <p className="text-xl text-slate-700 font-medium">
                     All 127 envelopes have been filled!
                   </p>
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Total Raised with Match</p>
                      <p className="text-5xl font-black text-slate-900 mt-2">
                        {formatCurrency(totalImpact)}
                      </p>
                   </div>
                   <p className="text-slate-600">
                     Thank you to every partner who joined us. You have made an incredible impact that will last forever.
                   </p>
                   <Button 
                     onClick={() => setShowCompletionModal(false)}
                     className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-full font-bold"
                   >
                     View the Wall of Heroes
                   </Button>
                </CardContent>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation Flow Overlay */}
      <AnimatePresence>
        {donatingEnvelope && (
          <DonationOverlay 
            key="donation-overlay"
            envelope={donatingEnvelope} 
            onClose={() => setDonatingEnvelope(null)} 
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>

      {/* Share Success Modal */}
      <AnimatePresence>
        {shareData && (
          <ShareModal 
            key="share-modal"
            data={shareData}
            onClose={() => setShareData(null)} 
          />
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default App;
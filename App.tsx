import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeData, Tier, StorageData } from './types';
import { CONFIG, TIERS, getTierForAmount } from './constants';
import { getInitialData, saveToStorage, formatCurrency, cn } from './lib/utils';
import { db } from './lib/supabase';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Badge } from './components/ui/CoreComponents';
import { EnvelopeGrid } from './components/EnvelopeGrid';
import { DonationOverlay } from './components/DonationOverlay';
import { ShareModal } from './components/ShareModal';

declare global { interface Window { confetti: any; } }

const App: React.FC = () => {
  const [data, setData] = useState<StorageData>(getInitialData());
  const [selectedIds, setSelectedIds] = useState<number[]>([]); 
  const [donatingEnvelope, setDonatingEnvelope] = useState<EnvelopeData | null>(null); 
  const [shareData, setShareData] = useState<{ amount: number, name: string } | null>(null);
  const [filter, setFilter] = useState<Tier>('ALL');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Derived
  const envelopes = Object.values(data.envelopes) as EnvelopeData[];
  const totalRaised = envelopes.reduce((sum, env) => env.isClaimed ? sum + env.amount : sum, 0);
  const claimedCount = envelopes.filter(e => e.isClaimed).length;
  const progressPercent = Math.min((totalRaised / CONFIG.GOAL_AMOUNT) * 100, 100);
  const isCampaignComplete = claimedCount >= CONFIG.TOTAL_ENVELOPES;
  const recentDonors = [...data.donors].sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()).slice(0, 5);
  const selectedTotal = selectedIds.reduce((sum, id) => sum + (data.envelopes[id]?.amount || 0), 0);

  // Timer
  useEffect(() => {
    const tick = () => {
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
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, []);

  // Sync
  useEffect(() => {
    const sync = async () => {
      const remote = await db.fetchAll();
      if (remote.envelopes) {
        setData(prev => {
          const mergedEnv = { ...prev.envelopes };
          Object.values(remote.envelopes!).forEach(r => {
            if (mergedEnv[r.id]) mergedEnv[r.id] = { ...mergedEnv[r.id], ...r };
          });
          const next = { envelopes: mergedEnv, donors: remote.donors || prev.donors };
          saveToStorage(next);
          return next;
        });
      }
    };
    sync();
    const unsub = db.subscribe(
      (env) => {
        setData(p => {
          const nextEnv = { ...p.envelopes, [env.id]: { ...p.envelopes[env.id], ...env } };
          const next = { ...p, envelopes: nextEnv };
          saveToStorage(next);
          return next;
        });
        if (env.isClaimed) setSelectedIds(ids => ids.filter(id => id !== env.id));
      },
      (donor) => {
        setData(p => {
           if (p.donors.some(d => d.claimedAt === donor.claimedAt)) return p;
           const next = { ...p, donors: [donor, ...p.donors] };
           saveToStorage(next);
           return next;
        });
      }
    );
    return () => { unsub(); }
  }, []);

  // Completion
  useEffect(() => {
    if (isCampaignComplete && !showCompletionModal) {
      setShowCompletionModal(true);
      if (window.confetti) {
        const end = Date.now() + 5000;
        const interval: any = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          window.confetti({ particleCount: 50, origin: { x: Math.random(), y: Math.random() - 0.2 } });
        }, 250);
      }
    }
  }, [isCampaignComplete]);

  const handleClaim = async (name: string, email: string) => {
    if (!donatingEnvelope) return;
    const ids = [...selectedIds];
    const amount = donatingEnvelope.amount;
    
    // Optimistic Update
    const newEnvs = { ...data.envelopes };
    ids.forEach(id => {
       if (newEnvs[id]) newEnvs[id] = { ...newEnvs[id], isClaimed: true };
    });
    const next = { envelopes: newEnvs, donors: [{ name, amount, claimedAt: new Date().toISOString() }, ...data.donors] };
    setData(next);
    saveToStorage(next);
    setDonatingEnvelope(null);
    setSelectedIds([]);
    setShareData({ amount, name });
    
    if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    await db.claimEnvelopes(ids, name, email);
  };

  return (
    // MASTER MOBILE SAFE CONTAINER
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-slate-50 relative shadow-2xl overflow-x-hidden">
      
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 mx-auto max-w-[420px] z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-5 py-3 flex justify-between items-center">
         <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>💌</span> The 127 Challenge
         </div>
         <Badge variant="gradient" className="text-[10px] animate-pulse">2X MATCH</Badge>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-5 pb-32">
        
        {/* Progress Card */}
        <Card className="mb-6 bg-white border-slate-200 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-60" />
           <CardContent className="pt-5 relative">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-sm font-medium text-slate-500">Raised</span>
                 <span className="text-2xl font-black text-slate-900">{formatCurrency(totalRaised)}</span>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-slate-400">
                 <span>{claimedCount}/127 Claimed</span>
                 <span>Goal: {formatCurrency(CONFIG.GOAL_AMOUNT)}</span>
              </div>
           </CardContent>
        </Card>

        {/* E3 + BBB Match Info */}
        <Card className="mb-6 bg-slate-900 text-white border-none">
           <CardContent className="pt-5">
              <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <span>🤝</span> Double Impact
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">E3 Partners</strong> and <strong className="text-white">Businesses Beyond Borders (BBB)</strong> are matching every dollar. Join the Hero List by Nov 29!
              </p>
           </CardContent>
        </Card>

        {/* Timer & Heroes */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Time Left</div>
              <div className="text-sm font-mono font-bold text-slate-900">
                 {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </div>
           </div>
           <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-center">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Latest Hero</div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {recentDonors[0] ? recentDonors[0].name : "Be the first!"}
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
           <button onClick={() => setFilter('ALL')} className={cn("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border", filter === 'ALL' ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}>View All</button>
           {TIERS.map(t => (
             <button key={t.label} onClick={() => setFilter(t.label)} className={cn("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border", filter === t.label ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}>
               ${t.min}-{t.max}
             </button>
           ))}
        </div>

        {/* The Grid */}
        <EnvelopeGrid 
          envelopes={envelopes} 
          selectedIds={selectedIds} 
          filter={filter} 
          isCampaignComplete={isCampaignComplete} 
          onToggle={(env) => {
             if (isCampaignComplete || env.isClaimed) return;
             setSelectedIds(prev => prev.includes(env.id) ? prev.filter(i => i !== env.id) : [...prev, env.id]);
          }}
        />
      </div>

      {/* Sticky Footer */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-[420px] bg-white border-t border-slate-200 p-5 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
          >
             <div className="flex justify-between items-center mb-3">
               <span className="text-sm font-medium text-slate-500">{selectedIds.length} Selected</span>
               <span className="text-2xl font-black text-slate-900">{formatCurrency(selectedTotal)}</span>
             </div>
             <div className="flex gap-3">
               <Button variant="outline" onClick={() => setSelectedIds([])} className="flex-1">Clear</Button>
               <Button 
                 className="flex-[2] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                 onClick={() => setDonatingEnvelope({ id: 0, amount: selectedTotal, isClaimed: false })}
               >
                 Donate Now
               </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur text-center p-5">
           <div className="text-white space-y-6">
              <div className="text-6xl">🏆</div>
              <h1 className="text-4xl font-black text-emerald-400">GOAL REACHED!</h1>
              <p className="text-lg text-slate-300">All 127 envelopes have been filled.</p>
              <div className="text-2xl font-bold">{formatCurrency(totalRaised * 2)} Impact</div>
              <Button onClick={() => setShowCompletionModal(false)} className="bg-white text-slate-900 mt-4">View Board</Button>
           </div>
        </div>
      )}

      <AnimatePresence>
        {donatingEnvelope && (
          <DonationOverlay 
            key="overlay" 
            envelope={donatingEnvelope} 
            onClose={() => setDonatingEnvelope(null)} 
            onClaim={handleClaim} 
          />
        )}
        {shareData && (
          <ShareModal 
            key="share" 
            data={shareData} 
            onClose={() => setShareData(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
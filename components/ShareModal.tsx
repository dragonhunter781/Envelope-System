import React from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui/CoreComponents';
import { formatCurrency } from '../lib/utils';
import { CONFIG } from '../constants';

interface ShareModalProps {
  onClose: () => void;
  data: { amount: number; name: string };
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, data }) => {
  const impactAmount = data.amount * CONFIG.MATCH_MULTIPLIER;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I just donated ${formatCurrency(data.amount)} to the 127 Envelope Challenge! My gift is being DOUBLED to ${formatCurrency(impactAmount)} through the E3 Partners + Businesses Beyond Borders matching fund. This is a one-time opportunity that ends November 29. Join me and add your name to the Hero List!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '127 Envelope Challenge', text: shareText, url: shareUrl });
      } catch (err) { console.log(err); }
    } else {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert("Copied to clipboard!");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-900 z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="h-2 bg-gradient-to-r from-emerald-500 to-sky-500 w-full" />
        
        <div className="p-6 text-center space-y-6">
           <div className="mx-auto bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center text-3xl border border-emerald-100">
             🎉
           </div>
           <div>
             <h3 className="text-xl font-bold text-slate-900">Thank you, {data.name}!</h3>
             <p className="text-slate-500 text-sm mt-1">Your impact has been doubled.</p>
           </div>
           
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                <span>You Gave</span>
                <span className="font-bold">{formatCurrency(data.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Impact</span>
                <span className="text-emerald-600">{formatCurrency(impactAmount)}</span>
              </div>
           </div>

           <Button onClick={handleShare} className="w-full bg-slate-900 text-white font-bold h-12 shadow-lg">
             Share Your Impact
           </Button>
        </div>
      </div>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui/CoreComponents';
import { formatCurrency } from '../lib/utils';
import { CONFIG } from '../constants';

interface ShareModalProps {
  onClose: () => void;
  data: {
    amount: number;
    name: string;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, data }) => {
  // Guard clause is handled by parent conditional rendering, but kept for type safety if needed.
  if (!data) return null;

  const impactAmount = data.amount * CONFIG.MATCH_MULTIPLIER;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://example.com'; 
  
  // Updated text as requested
  const shareText = `I just donated ${formatCurrency(data.amount)} to The 127 Envelope Challenge! It's a one-time gift that is being DOUBLED to ${formatCurrency(impactAmount)}. We need more partners to finish this by the end of November! Add your name to the hero list here:`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The 127 Envelope Challenge',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert("Link copied to clipboard!");
    }
  };

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md relative"
      >
          {/* Close X */}
          <button 
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-8 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <Card className="border-emerald-500/30 bg-white text-slate-900 shadow-2xl overflow-hidden">
          {/* Success Header Gradient */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-sky-500" />
          
          <CardHeader className="text-center pb-2 pt-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mx-auto bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-emerald-100"
            >
                <span className="text-4xl">🎉</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-slate-900">Thank You, {data.name}!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8 text-center px-8 pb-8">
            <div className="space-y-2">
              <p className="text-slate-500 uppercase tracking-wider text-xs font-semibold">Impact Summary</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-center gap-2 text-lg text-slate-700">
                      <span>You gave</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(data.amount)}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2 w-1/2 mx-auto" />
                  <div className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900">
                      <span>Total Impact</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">{formatCurrency(impactAmount)}</span>
                  </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                E3 Partners is a recognized 501(c)(3) nonprofit. Your gift is tax-deductible.
              </p>
            </div>

            <div className="space-y-4">
                <p className="text-sm font-medium text-slate-600">Multiply your impact by sharing:</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button onClick={handleShare} className="w-full h-12 text-md bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-lg">
                      Share Challenge
                  </Button>
                  
                  <div className="flex gap-2 justify-center">
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-slate-100 rounded hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] transition-all text-slate-500 text-center text-sm font-medium">Twitter</a>
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-slate-100 rounded hover:bg-[#4267B2]/20 hover:text-[#4267B2] transition-all text-slate-500 text-center text-sm font-medium">Facebook</a>
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-slate-100 rounded hover:bg-[#0077b5]/20 hover:text-[#0077b5] transition-all text-slate-500 text-center text-sm font-medium">LinkedIn</a>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
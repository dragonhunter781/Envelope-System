import React, { useState } from 'react';
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
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const impactAmount = data.amount * CONFIG.MATCH_MULTIPLIER;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://example.com';

  // Optimized share text for social media
  const shareText = `I just gave ${formatCurrency(data.amount)} to The 127 Envelope Challenge and it's being DOUBLED to ${formatCurrency(impactAmount)}! Only a few days left - join me in making an impact!`;

  // Shorter text for Twitter
  const twitterText = `Just donated to The 127 Envelope Challenge - my ${formatCurrency(data.amount)} gift is being DOUBLED! Join me:`;

  // WhatsApp/SMS text
  const messageText = `Hey! I just donated ${formatCurrency(data.amount)} to The 127 Envelope Challenge and it's being matched 2X! We only have a few days left to reach the goal. Would you consider joining me? Every dollar is doubled! ${shareUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The 127 Envelope Challenge - Double Your Impact!',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(messageText)}`,
    sms: `sms:?body=${encodeURIComponent(messageText)}`,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md lg:max-w-lg relative"
      >
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-8 p-2 text-white/70 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <Card className="border-0 bg-white text-slate-900 shadow-2xl overflow-hidden">
          {/* Animated Success Header */}
          <div className="relative h-24 lg:h-28 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 flex items-center justify-center overflow-hidden">
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  initial={{ y: 100, x: Math.random() * 100 + '%', opacity: 0 }}
                  animate={{
                    y: -20,
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-white w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-3xl lg:text-4xl">🎉</span>
            </motion.div>
          </div>

          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-2xl lg:text-3xl font-black text-slate-900">
              You're Amazing, {data.name}!
            </CardTitle>
            <p className="text-slate-500 text-sm mt-1">Your generosity is making a real difference</p>
          </CardHeader>

          <CardContent className="space-y-6 text-center px-6 lg:px-8 pb-8">
            {/* Impact Display */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl p-5 border border-emerald-100"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Your Gift</p>
                  <p className="text-2xl font-black text-slate-700">{formatCurrency(data.amount)}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-2xl"
                >
                  ✕2
                </motion.div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Impact</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">
                    {formatCurrency(impactAmount)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                E3 Partners (501c3) - Your gift is tax-deductible
              </p>
            </motion.div>

            {/* Share CTA */}
            <div className="space-y-3">
              <p className="text-base font-bold text-slate-700">
                Help us reach more people!
              </p>
              <p className="text-sm text-slate-500">
                Share this challenge and inspire others to give
              </p>

              {/* Primary Share Button */}
              <Button
                onClick={handleShare}
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold shadow-lg rounded-xl"
              >
                <span className="mr-2">📤</span> Share Your Impact
              </Button>

              {/* Social Media Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl transition-all group"
                >
                  <span className="text-2xl mb-1">💬</span>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#25D366]">WhatsApp</span>
                </a>
                <a
                  href={socialLinks.sms}
                  className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
                >
                  <span className="text-2xl mb-1">📱</span>
                  <span className="text-[10px] font-medium text-slate-600">Text</span>
                </a>
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-[#4267B2]/10 hover:bg-[#4267B2]/20 rounded-xl transition-all group"
                >
                  <span className="text-2xl mb-1">📘</span>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#4267B2]">Facebook</span>
                </a>
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 rounded-xl transition-all group"
                >
                  <span className="text-2xl mb-1">🐦</span>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#1DA1F2]">Twitter</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
                >
                  <span className="text-2xl mb-1">{copied ? '✅' : '🔗'}</span>
                  <span className="text-[10px] font-medium text-slate-600">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Close/Done Button */}
            <button
              onClick={onClose}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors mt-2"
            >
              Done sharing? Close this
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

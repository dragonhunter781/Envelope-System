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

// SVG Icons for Social Media
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SMSIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#5C6BC0">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#000000">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#10B981">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
  </svg>
);

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, data }) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const impactAmount = data.amount * CONFIG.MATCH_MULTIPLIER;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://example.com';

  // Optimized share text for social media - Updated for BBB
  const shareText = `I just gave ${formatCurrency(data.amount)} to Businesses Beyond Borders through The 127 Envelope Challenge and it's being DOUBLED to ${formatCurrency(impactAmount)}! Only a few days left - join me in making an impact!`;

  // Shorter text for Twitter/X
  const twitterText = `Just donated to @BBB_org through The 127 Envelope Challenge - my ${formatCurrency(data.amount)} gift is being DOUBLED! Join me:`;

  // WhatsApp/SMS text - Updated for BBB
  const messageText = `Hey! I just donated ${formatCurrency(data.amount)} to Businesses Beyond Borders (a 501c3) through The 127 Envelope Challenge and it's being matched 2X! We only have a few days left to reach the goal. Would you consider joining me? Every dollar is doubled! ${shareUrl}`;

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
              <svg className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
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
                  className="text-2xl font-black text-emerald-500"
                >
                  ×2
                </motion.div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Impact</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">
                    {formatCurrency(impactAmount)}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-100 mt-3">
                <p className="text-xs text-slate-500 font-medium">
                  Donated to <span className="font-bold text-slate-700">Businesses Beyond Borders</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  501(c)(3) Tax-Deductible • EIN: Available on receipt
                </p>
              </div>
            </motion.div>

            {/* Share CTA */}
            <div className="space-y-3">
              <p className="text-base font-bold text-slate-700">
                Help us reach more people!
              </p>
              <p className="text-sm text-slate-500">
                Share this challenge and inspire others to give to BBB
              </p>

              {/* Primary Share Button */}
              <Button
                onClick={handleShare}
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-bold shadow-lg rounded-xl flex items-center justify-center gap-2"
              >
                <ShareIcon /> Share Your Impact
              </Button>

              {/* Social Media Grid with Real Icons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl transition-all group"
                >
                  <WhatsAppIcon />
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#25D366] mt-1">WhatsApp</span>
                </a>
                <a
                  href={socialLinks.sms}
                  className="flex flex-col items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all group"
                >
                  <SMSIcon />
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-indigo-600 mt-1">Text</span>
                </a>
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 rounded-xl transition-all group"
                >
                  <FacebookIcon />
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#1877F2] mt-1">Facebook</span>
                </a>
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
                >
                  <TwitterIcon />
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-black mt-1">X</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
                >
                  {copied ? <CheckIcon /> : <LinkIcon />}
                  <span className="text-[10px] font-medium text-slate-600 mt-1">{copied ? 'Copied!' : 'Copy'}</span>
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

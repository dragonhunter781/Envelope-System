
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
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousMessage, setAnonymousMessage] = useState('');
  const [donationCompleted, setDonationCompleted] = useState(false);
  const hasClaimedRef = React.useRef(false);

  useEffect(() => {
    setAnimationStage(0);
    setStep('details');
    setDonorName('');
    setEmail('');
    setIsAnonymous(false);
    setAnonymousMessage('');
    setDonationCompleted(false);
    hasClaimedRef.current = false;

    const t1 = setTimeout(() => setAnimationStage(1), 300); // Zoom
    const t2 = setTimeout(() => setAnimationStage(2), 800); // Open
    const t3 = setTimeout(() => setAnimationStage(3), 1400); // Expand

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [envelope.id]);

  // Listen for Donorbox postMessage events to detect donation completion
  useEffect(() => {
    const handleDonorboxMessage = (event: MessageEvent) => {
      // Check if message is from Donorbox
      if (event.origin !== 'https://donorbox.org') return;

      // Log all messages for debugging
      console.log('📬 Donorbox message received:', event.data);

      // Donorbox sends various message types - check for completion signals
      const data = event.data;

      // Handle string messages
      if (typeof data === 'string') {
        // Donorbox may send "donation_complete" or similar strings
        if (data.includes('complete') || data.includes('success') || data.includes('thank')) {
          handleDonationSuccess();
        }
      }

      // Handle object messages
      if (typeof data === 'object' && data !== null) {
        // Check for common completion indicators
        if (
          data.type === 'donation_complete' ||
          data.type === 'donorbox_donation_complete' ||
          data.status === 'completed' ||
          data.status === 'success' ||
          data.event === 'donation_complete' ||
          data.event === 'thank_you' ||
          data.donationComplete === true ||
          data.completed === true
        ) {
          handleDonationSuccess();
        }
      }
    };

    const handleDonationSuccess = () => {
      // Prevent duplicate claims
      if (hasClaimedRef.current) return;
      hasClaimedRef.current = true;

      console.log('✅ Donation completed! Auto-claiming envelope...');
      setDonationCompleted(true);
      setStep('success');

      // Use the stored donor name (already set in handleDetailsSubmit for anonymous)
      const finalName = isAnonymous ? `Anonymous: "${anonymousMessage}"` : donorName;
      onClaim(finalName, email);
    };

    // Only listen when on payment step
    if (step === 'payment') {
      window.addEventListener('message', handleDonorboxMessage);
      console.log('👂 Listening for Donorbox messages...');
    }

    return () => {
      window.removeEventListener('message', handleDonorboxMessage);
    };
  }, [step, donorName, email, isAnonymous, anonymousMessage, onClaim]);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isAnonymous && !donorName) return;
    if (isAnonymous && !anonymousMessage) {
      alert('Please select a message for your anonymous donation.');
      return;
    }
    if (!email) return;

    // Set donor name for anonymous donations
    if (isAnonymous) {
      setDonorName(`Anonymous: "${anonymousMessage}"`);
    }

    setStep('payment');
  };

  const handlePaymentComplete = () => {
    // Prevent duplicate claims
    if (hasClaimedRef.current) return;
    hasClaimedRef.current = true;

    const finalName = isAnonymous ? `Anonymous: "${anonymousMessage}"` : donorName;
    setDonationCompleted(true);
    setStep('success');
    onClaim(finalName, email);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ touchAction: 'none', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
    >
      <div className="relative w-full max-w-[420px] lg:max-w-2xl h-screen flex flex-col items-center justify-center overflow-hidden" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Envelope Animation Container */}
        <motion.div
          className="relative z-20 w-56 md:w-64 lg:w-72 shrink-0"
          initial={{ scale: 0.5, y: 100, opacity: 0 }}
          animate={{ 
            scale: animationStage >= 3 ? 0.6 : 1, 
            y: animationStage >= 3 ? -120 : 0,
            opacity: animationStage >= 3 ? 0 : 1
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Envelope3D 
              amount={envelope.amount} 
              isOpen={animationStage >= 2} 
              showContent={false}
              className="drop-shadow-2xl"
            />
        </motion.div>

        {/* Form Container */}
        <motion.div
            className="absolute z-30 w-[92%] max-w-[380px] lg:max-w-[500px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ y: 100, height: 0, opacity: 0 }}
            animate={{
              y: animationStage === 3 ? 0 : 100,
              height: animationStage === 3 ? (step === 'payment' ? '85%' : step === 'success' ? 'auto' : 'auto') : 0,
              opacity: animationStage === 3 ? 1 : 0
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ maxHeight: '85%' }}
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20 pointer-events-none"></div>

            <div className="relative flex flex-col h-full overflow-y-auto no-scrollbar">
                
                {/* Header */}
                <div className="text-center pt-8 pb-4 px-6 bg-slate-50 border-b border-slate-100">
                   <h2 className="text-4xl font-black text-slate-900 mb-1">{formatCurrency(envelope.amount)}</h2>
                   <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                     Becomes {formatCurrency(envelope.amount * CONFIG.MATCH_MULTIPLIER)}
                   </p>
                </div>

                {/* Form Content */}
                <div className="p-6 flex-1">
                  {step === 'details' ? (
                    <form onSubmit={handleDetailsSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       {/* Anonymous Toggle */}
                       <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                         <input
                           type="checkbox"
                           id="anonymous"
                           checked={isAnonymous}
                           onChange={(e) => setIsAnonymous(e.target.checked)}
                           className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                         />
                         <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
                           Give anonymously
                         </label>
                       </div>

                       {/* Name Field - Hidden when anonymous */}
                       {!isAnonymous && (
                         <div>
                           <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Your Name</label>
                           <Input
                             required
                             value={donorName}
                             onChange={(e) => setDonorName(e.target.value)}
                             placeholder="Enter your name"
                             className="h-12 text-lg"
                           />
                         </div>
                       )}

                       {/* Anonymous Message Selection */}
                       {isAnonymous && (
                         <div>
                           <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Select a Message</label>
                           <div className="space-y-2">
                             {[
                               "Giving with gratitude!",
                               "Blessed to be a blessing.",
                               "For the glory of God!",
                               "Happy to help!"
                             ].map((msg) => (
                               <button
                                 key={msg}
                                 type="button"
                                 onClick={() => setAnonymousMessage(msg)}
                                 className={cn(
                                   "w-full p-3 text-left rounded-lg border-2 transition-all text-sm",
                                   anonymousMessage === msg
                                     ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                     : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                 )}
                               >
                                 "{msg}"
                               </button>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Email - Always required */}
                       <div>
                         <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email (for receipt)</label>
                         <Input
                           required
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="receipt@example.com"
                           className="h-12 text-lg"
                         />
                       </div>

                       <Button type="submit" className="w-full h-14 mt-4 text-lg font-bold bg-slate-900 text-white rounded-xl shadow-lg">
                         Next Step
                       </Button>
                    </form>
                  ) : step === 'payment' ? (
                    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
                       <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden mb-4 relative">
                          <iframe
                              src={`https://donorbox.org/embed/matching-donation-campaign?amount=${envelope.amount}&hide_donation_meter=true&email=${encodeURIComponent(email)}&first_name=${encodeURIComponent(isAnonymous ? 'Anonymous' : donorName.split(' ')[0])}&last_name=${encodeURIComponent(isAnonymous ? 'Donor' : donorName.split(' ').slice(1).join(' ') || '')}`}
                              name="donorbox"
                              frameBorder="0"
                              scrolling="yes"
                              allow="payment"
                              className="w-full h-full absolute inset-0"
                            />
                       </div>
                       <p className="text-xs text-slate-500 text-center mb-2">
                         Your donation will be recorded automatically when complete.
                       </p>
                       <Button onClick={handlePaymentComplete} variant="outline" className="w-full h-10 text-slate-600 border-slate-300 rounded-xl shrink-0">
                          I Already Donated (manual confirmation)
                       </Button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 py-8">
                       <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                         <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                         </svg>
                       </div>
                       <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
                       <p className="text-slate-600 text-center mb-6">
                         Your generous donation of {formatCurrency(envelope.amount)} has been recorded.
                       </p>
                       <Button onClick={onClose} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
                          Close
                       </Button>
                    </div>
                  )}
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

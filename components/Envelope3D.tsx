import React from 'react';
import { motion, Variants } from 'framer-motion';
import { getTierForAmount } from '../constants';
import { cn } from '../lib/utils';

interface Envelope3DProps {
  amount: number;
  isClaimed?: boolean;
  isOpen: boolean;
  showContent?: boolean;
  className?: string;
}

export const Envelope3D: React.FC<Envelope3DProps> = ({ amount, isClaimed, isOpen, showContent, className }) => {
  const tier = getTierForAmount(amount);

  // Animation variants for the flap
  const flapVariants: Variants = {
    closed: {
      scaleY: 1,
      y: 0,
      zIndex: 30,
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    open: {
      scaleY: -1,
      y: '-100%',
      zIndex: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Back of flap (white) variants - only visible when open
  const flapBackVariants: Variants = {
    closed: {
      opacity: 0,
      scaleY: -1,
      y: '100%',
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    open: {
      opacity: 1,
      scaleY: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className={cn("relative w-full aspect-[5/4]", className)}>
      <div className={cn(
        "relative w-full h-full transition-all duration-300",
        isClaimed && !isOpen && "opacity-60 saturate-50"
      )}>
        
        {/* 1. Back Paper (White Background) - Standard 2D */}
        <div className="absolute inset-0 bg-white rounded-sm shadow-sm border border-slate-200" />

        {/* 2. The Letter/Card (Hidden initially, slides up) - Standard 2D */}
        {showContent && (
          <motion.div 
            className="absolute inset-x-3 bottom-0 top-auto h-[90%] bg-white shadow-sm border border-slate-100 rounded z-10"
            initial={{ y: "100%" }}
            animate={{ y: "-60%" }}
          />
        )}

        {/* 3. The Front Pocket - Standard 2D (Crucial for Safari visibility) */}
        {/* We removed backface-visibility and perspective from parent to ensure this layer is painted */}
        <div 
          className="absolute inset-x-0 bottom-0 top-[35%] z-20 flex items-end justify-center pb-2"
          style={{ 
            backgroundColor: tier?.solid || '#10b981',
            backgroundImage: tier?.gradient,
            backgroundSize: 'cover',
            // Clean V-shape notch
            clipPath: 'polygon(0% 100%, 0% 0%, 50% 20%, 100% 0%, 100% 100%)',
            WebkitClipPath: 'polygon(0% 100%, 0% 0%, 50% 20%, 100% 0%, 100% 100%)', 
            transform: 'translateZ(0)', // Force GPU
          }}
        >
             <div className="flex flex-col items-center">
                <span className="text-white font-bold text-lg z-30 leading-none drop-shadow-sm">${amount}</span>
                {isClaimed && <span className="text-sm">✅</span>}
             </div>
        </div>

        {/* 4a. Front of Flap (colored) - visible when closed, hides when open */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[35%] z-30"
          variants={flapVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          style={{
            transformOrigin: 'center bottom',
            WebkitTransformOrigin: 'center bottom'
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: tier?.solid || '#10b981',
              backgroundImage: tier?.gradient,
              backgroundSize: 'cover',
              clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
              WebkitClipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)'
            }}
          />
        </motion.div>

        {/* 4b. Back of Flap (white) - hidden when closed, visible when open */}
        <motion.div
          className="absolute -top-[35%] left-0 right-0 h-[35%] z-20"
          variants={flapBackVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          style={{
            transformOrigin: 'center bottom',
            WebkitTransformOrigin: 'center bottom'
          }}
        >
          <div
            className="absolute inset-0 bg-white border border-slate-200"
            style={{
              clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              WebkitClipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)'
            }}
          />
        </motion.div>

      </div>
    </div>
  );
};
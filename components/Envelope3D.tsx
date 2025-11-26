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

  // Animation variants for the flap - rotates backward (negative) to open correctly
  const flapVariants: Variants = {
    closed: {
      rotateX: 0,
      zIndex: 30,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    open: {
      rotateX: -180,
      zIndex: 1,
      transition: { duration: 0.6, ease: "easeInOut" }
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

        {/* 4. The Flap Container - 3D Context Isolated Here */}
        <div
          className="absolute top-0 left-0 right-0 h-[35%] z-30 perspective-1000"
          style={{
            WebkitPerspective: '1000px',
            perspective: '1000px'
          }}
        >
          <motion.div
            className="w-full h-full transform-style-3d"
            variants={flapVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            style={{
              willChange: 'transform',
              WebkitTransformStyle: 'preserve-3d',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center bottom',
              WebkitTransformOrigin: 'center bottom'
            }}
          >
            {/* Front of Flap (Closed state) - triangle pointing UP, base at bottom */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: tier?.solid || '#10b981',
                backgroundImage: tier?.gradient,
                backgroundSize: 'cover',
                clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                WebkitClipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(1px)',
                WebkitTransform: 'translateZ(1px)'
              }}
            />

            {/* Back of Flap (Visible when open) */}
            <div
               className="absolute inset-0 bg-white/95"
               style={{
                 transform: 'rotateX(180deg) translateZ(0px)',
                 WebkitTransform: 'rotateX(180deg) translateZ(0px)',
                 clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                 WebkitClipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                 backfaceVisibility: 'hidden',
                 WebkitBackfaceVisibility: 'hidden'
               }}
            />
          </motion.div>
        </div>

      </div>
    </div>
  );
};
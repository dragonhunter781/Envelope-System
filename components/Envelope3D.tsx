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

  const flapVariants: Variants = {
    closed: { 
      rotateX: 0, 
      zIndex: 30,
      transition: { 
        rotateX: { duration: 0.5 },
        zIndex: { delay: 0 } 
      }
    },
    open: { 
      rotateX: 180, 
      zIndex: 1, // Drop z-index so letter (z-10) slides OVER the flap
      transition: { 
        rotateX: { duration: 0.5, ease: "easeInOut" },
        zIndex: { delay: 0.2 } // Wait for flap to lift before dropping z-index
      }
    }
  };

  return (
    <div className={cn("relative w-full aspect-[4/3] perspective-1000", className)}>
      
      {/* Container for the envelope parts */}
      <div className={cn(
        "relative w-full h-full transition-transform duration-300 transform-style-3d",
        isClaimed && !isOpen && "grayscale opacity-50"
      )}>
        
        {/* Back of Envelope (Inside Color) */}
        <div className="absolute inset-0 bg-white rounded-md border border-slate-200" />

        {/* The Letter/Card (Hidden initially, slides up) */}
        {showContent && (
          <div className="absolute inset-x-2 bottom-2 top-4 bg-white rounded shadow-md z-10" />
        )}

        {/* Front Body of Envelope */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 h-2/3 z-20 rounded-b-md shadow-lg overflow-hidden",
          "bg-gradient-to-br border-t border-white/20",
          tier.gradient
        )}>
           {/* Texture/Pattern Overlay */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-30 mix-blend-overlay"></div>
           
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl drop-shadow-md">
               ${amount}
             </span>
             {isClaimed && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                 <span className="text-xl sm:text-2xl drop-shadow-sm">✅</span>
               </div>
             )}
           </div>
        </div>

        {/* Flap */}
        <motion.div
          className={cn(
            "absolute inset-x-0 top-0 h-1/2 origin-top transform-style-3d", // Reduced height to 1/2 for realistic proportions
            "bg-gradient-to-b from-white/20 to-transparent"
          )}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={flapVariants}
        >
          {/* Flap Front (When closed - Triangle pointing down) */}
          <div className={cn(
              "absolute inset-0 backface-hidden rounded-t-md",
               "bg-gradient-to-b", 
               tier.gradient,
               "brightness-95 shadow-md"
          )} style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-30 mix-blend-overlay"></div>
          </div>

          {/* Flap Back (When open - visible inside - Triangle pointing UP after rotation) */}
          <div 
            className="absolute inset-0 bg-white rotate-x-180 backface-hidden rounded-t-md border-t border-l border-r border-slate-200"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
          />
        </motion.div>
      </div>
    </div>
  );
};
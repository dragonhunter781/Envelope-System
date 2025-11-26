import React from 'react';
import { motion, Variants } from 'framer-motion';
import { getTierForAmount } from '../constants';
import { cn } from '../lib/utils';

interface Envelope3DProps {
  amount: number;
  isClaimed?: boolean;
  isOpen: boolean;
  className?: string;
}

export const Envelope3D: React.FC<Envelope3DProps> = ({ amount, isClaimed, isOpen, className }) => {
  const tier = getTierForAmount(amount);

  const flapVariants: Variants = {
    closed: { 
      rotateX: 0, 
      zIndex: 30,
      transition: { rotateX: { duration: 0.5 }, zIndex: { delay: 0 } }
    },
    open: { 
      rotateX: 180, 
      zIndex: 0, 
      transition: { rotateX: { duration: 0.5 }, zIndex: { delay: 0.2 } }
    }
  };

  return (
    <div className={cn("relative w-full aspect-[5/4] perspective-1000", className)}>
      <div className={cn(
        "relative w-full h-full transform-style-3d transition-opacity duration-300",
        isClaimed && !isOpen && "grayscale opacity-60"
      )}>
        
        {/* Inside Back */}
        <div className="absolute inset-0 bg-white rounded-md border border-slate-200" />

        {/* Front Body */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 z-20 rounded-b-md shadow-md border-t border-white/20 flex items-center justify-center"
          style={{ background: tier.background, backgroundColor: tier.solid }}
        >
           <span className="text-white font-bold text-lg drop-shadow-md z-30">${amount}</span>
           {isClaimed && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-40">
               <span className="text-2xl">✅</span>
             </div>
           )}
        </div>

        {/* Flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-1/2 origin-top transform-style-3d"
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={flapVariants}
        >
          {/* Flap Front (Closed View) */}
          <div 
             className="absolute inset-0 backface-hidden rounded-t-md brightness-95 shadow-sm"
             style={{ 
               clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
               background: tier.background,
               backgroundColor: tier.solid
             }}
          />

          {/* Flap Back (Open View - Rotated Y to point UP) */}
          <div 
            className="absolute inset-0 bg-white rotate-y-180 backface-hidden rounded-t-md border-t border-l border-r border-slate-200"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}
          />
        </motion.div>
      </div>
    </div>
  );
};
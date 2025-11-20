'use client';

import { Card as CardType } from '@/types/game';
import { getCardImagePath } from '@/utils/cardUtils';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onClick?: () => void;
  isFaceUp?: boolean;
  size?: 'small' | 'medium' | 'large';
  zIndex?: number;
  className?: string;
}

export default function Card({
  card,
  isSelected = false,
  onClick,
  isFaceUp = true,
  size = 'medium',
  zIndex = 0,
  className = '',
}: CardProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-16 md:w-16 md:h-24',
    medium: 'w-16 h-24 md:w-20 md:h-28',
    large: 'w-24 h-36 md:w-32 md:h-48',
  };

  const handleClick = () => {
    if (onClick && isFaceUp) {
      onClick();
    }
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      style={{ zIndex }}
      onClick={handleClick}
      whileHover={isFaceUp && onClick ? { 
        y: -15, 
        scale: 1.15,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={isFaceUp && onClick ? { scale: 0.9 } : {}}
      animate={{
        y: isSelected ? -30 : 0,
        rotate: isSelected ? 0 : 0,
        scale: isSelected ? 1.15 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
        <motion.div
          className={`relative w-full h-full ${isFaceUp && onClick ? 'cursor-pointer' : 'cursor-default'}`}
          animate={{
            rotateY: isFaceUp ? 180 : 0,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Back */}
          <div
            className="absolute inset-0 card-back rounded-xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <div className="text-white text-3xl font-bold mb-1 drop-shadow-lg">♠♥♦♣</div>
              <div className="text-white/80 text-xs font-semibold">CARD</div>
            </div>
          </div>

          {/* Card Front */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border-2 border-white/90"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <Image
              src={getCardImagePath(card)}
              alt={`${card.rank} of ${card.suit || 'joker'}`}
              fill
              className="object-cover"
              unoptimized
              priority={isSelected}
            />
            {isSelected && (
              <>
                <motion.div 
                  className="absolute inset-0 border-4 border-sky-400 rounded-xl"
                  style={{ borderColor: '#38bdf8' }}
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(56, 189, 248, 0)',
                      '0 0 30px rgba(56, 189, 248, 1)',
                      '0 0 0px rgba(56, 189, 248, 0)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

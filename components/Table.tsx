'use client';

import { Card as CardType, Play } from '@/types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankDisplay } from '@/utils/cardUtils';

interface TableProps {
  discardPile: CardType[];
  lastPlay: Play | null;
  animationState: {
    type: 'none' | 'cardDrop' | 'bullshit' | 'pickup';
    cards?: CardType[];
    targetPlayerId?: string;
  };
}

export default function Table({ discardPile, lastPlay, animationState }: TableProps) {
  const visibleCards = discardPile.slice(-12);
  const totalCards = discardPile.length;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {/* Table Surface with Wood Texture Effect */}
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-500/20 to-teal-400/20 rounded-full blur-3xl -z-10" />
        
        {/* Main Table Container */}
        <div className="relative bg-gradient-to-br from-emerald-900/40 via-green-800/50 to-teal-900/40 backdrop-blur-md rounded-3xl p-6 md:p-10 border-2 border-green-400/50 shadow-2xl">
          {/* Inner Glow Border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-green-300/10 to-transparent" />
          
          {/* Decorative Corner Elements */}
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-green-400/30 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-green-400/30 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-green-400/30 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-green-400/30 rounded-br-lg" />

          {/* Header Section */}
          <div className="text-center mb-6 relative z-10">
            <motion.h2 
              className="text-white text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                Discard Pile
              </span>
            </motion.h2>
            
            {/* Card Count Badge */}
            <motion.div
              className="inline-block bg-green-500/20 border border-green-400/50 rounded-full px-4 py-1 mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              <span className="text-green-200 text-sm font-semibold">
                {totalCards} {totalCards === 1 ? 'Card' : 'Cards'}
              </span>
            </motion.div>

            {/* Last Play Info */}
            {lastPlay && (
              <motion.div
                className="mt-4 bg-black/30 rounded-xl p-3 border border-yellow-400/30 backdrop-blur-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <div className="text-yellow-200 text-xs uppercase tracking-wider mb-1">
                  Last Play
                </div>
                <div className="text-yellow-300 text-lg md:text-xl font-bold">
                  {getRankDisplay(lastPlay.claimedRank)}
                  <span className="text-yellow-400/70 text-base ml-2">
                    ({lastPlay.cards.length} {lastPlay.cards.length === 1 ? 'card' : 'cards'})
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Card Display Area */}
          <div className="relative flex items-center justify-center min-h-[160px] min-w-[280px] md:min-h-[200px] md:min-w-[360px]">
            {visibleCards.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {visibleCards.map((card, index) => {
                  const isNewCard = animationState.type === 'cardDrop' && 
                    index >= visibleCards.length - (animationState.cards?.length || 0);
                  const stackOffset = Math.min(index * 6, 50);
                  const rotation = (index - visibleCards.length / 2) * 1.5;
                  
                  return (
                    <motion.div
                      key={card.id}
                      className="absolute"
                      initial={
                        isNewCard
                          ? { 
                              scale: 0, 
                              rotate: -180, 
                              y: -200,
                              x: (Math.random() - 0.5) * 100,
                              opacity: 0
                            }
                          : { 
                              scale: 0.8, 
                              opacity: 0,
                              y: 30,
                              rotate: rotation
                            }
                      }
                      animate={{
                        scale: index === visibleCards.length - 1 ? 1.05 : 0.85 + (index / visibleCards.length) * 0.15,
                        rotate: rotation,
                        y: -Math.min(stackOffset * 0.4, 20),
                        x: stackOffset - (visibleCards.length * 3),
                        opacity: 1,
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0,
                        y: -30,
                        rotate: rotation + 45
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                        delay: isNewCard
                          ? (index - (visibleCards.length - (animationState.cards?.length || 0))) * 0.08
                          : index * 0.03,
                      }}
                      style={{
                        zIndex: visibleCards.length - index + 10,
                      }}
                      whileHover={!isNewCard ? {
                        scale: 1.2,
                        y: -Math.min(stackOffset * 0.4, 20) - 15,
                        zIndex: 100,
                        transition: { duration: 0.2 }
                      } : {}}
                    >
                      <Card
                        card={card}
                        isFaceUp={false}
                        size="medium"
                        zIndex={visibleCards.length - index + 10}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  🎴
                </motion.div>
                <div className="text-white/50 text-base font-medium">
                  Waiting for cards...
                </div>
              </motion.div>
            )}
          </div>

          {/* Bullshit Animation Overlay */}
          {animationState.type === 'bullshit' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-3xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Background Flash */}
              <motion.div
                className="absolute inset-0 bg-red-500/20"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.5, 0.3, 0],
                }}
                transition={{ duration: 1.5 }}
              />
              
              {/* Bullshit Text */}
              <motion.div
                className="relative z-10"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.3, 1.1, 1.2],
                  rotate: [0, 5, -5, 0],
                }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  duration: 0.8,
                  times: [0, 0.3, 0.6, 1],
                }}
              >
                <div className="text-red-500 text-5xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] tracking-wider">
                  BULLSHIT!
                </div>
                <motion.div
                  className="absolute inset-0 text-red-400 text-5xl md:text-7xl font-black blur-xl opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  BULLSHIT!
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

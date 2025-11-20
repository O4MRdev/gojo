'use client';

import { Card as CardType, Play, Rank } from '@/types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankDisplay } from '@/utils/cardUtils';
import { getRankDisplayName } from '@/utils/gameLogic';

interface GameTableProps {
  discardPile: CardType[];
  lastPlay: Play | null;
  currentRank: Rank;
  animationState: {
    type: 'none' | 'cardDrop' | 'bullshit' | 'pickup';
    cards?: CardType[];
    targetPlayerId?: string;
  };
}

export default function GameTable({ discardPile, lastPlay, currentRank, animationState }: GameTableProps) {
  const visibleCards = discardPile.slice(-15);
  const totalCards = discardPile.length;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {/* Brown Game Table */}
      <motion.div
        className="relative"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Table Shadow */}
        <div className="absolute inset-0 bg-black/30 rounded-full blur-2xl -z-10 transform scale-150" />
        
        {/* Main Table */}
        <div className="relative bg-gradient-to-br from-amber-900/95 via-amber-800/95 to-yellow-900/95 backdrop-blur-sm rounded-3xl p-6 md:p-10 border-4 border-amber-700/80 shadow-2xl">
          {/* Wood Grain Texture Effect */}
          <div className="absolute inset-0 rounded-3xl opacity-20" style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
          }} />
          
          {/* Table Border Decoration */}
          <div className="absolute inset-2 rounded-2xl border-2 border-amber-600/30" />

          {/* Header - Current Rank and Card Count */}
          <div className="text-center mb-6 relative z-10">
            {/* Card Count Display */}
            <motion.div
              className="inline-block bg-white/95 border-4 border-black rounded-lg px-6 py-3 mb-4 shadow-lg"
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className="text-4xl md:text-5xl font-black text-gray-900">
                {totalCards}
              </div>
            </motion.div>

            {/* Current Rank Display */}
            {lastPlay ? (
              <motion.div
                className="mt-4 bg-black/40 rounded-xl p-4 border-2 border-white/20 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">
                  Last Play
                </div>
                <div className="text-white text-xl md:text-2xl font-bold">
                  {lastPlay.claimedCount}x {getRankDisplay(lastPlay.claimedRank)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="mt-4 bg-black/40 rounded-xl p-4 border-2 border-white/20 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">
                  Current Rank
                </div>
                <div className="text-white text-xl md:text-2xl font-bold">
                  {getRankDisplayName(currentRank)}
                </div>
              </motion.div>
            )}
          </div>

          {/* Card Pile Display */}
          <div className="relative flex items-center justify-center min-h-[180px] min-w-[300px] md:min-h-[220px] md:min-w-[380px]">
            {visibleCards.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {visibleCards.map((card, index) => {
                  const isNewCard = animationState.type === 'cardDrop' && 
                    index >= visibleCards.length - (animationState.cards?.length || 0);
                  const stackOffset = Math.min(index * 5, 45);
                  const rotation = (index - visibleCards.length / 2) * 1.2;
                  
                  return (
                    <motion.div
                      key={card.id}
                      className="absolute"
                      initial={
                        isNewCard
                          ? { 
                              scale: 0, 
                              rotate: -180, 
                              y: -250,
                              x: (Math.random() - 0.5) * 120,
                              opacity: 0
                            }
                          : { 
                              scale: 0.8, 
                              opacity: 0,
                              y: 40,
                              rotate: rotation
                            }
                      }
                      animate={{
                        scale: index === visibleCards.length - 1 ? 1.08 : 0.82 + (index / visibleCards.length) * 0.2,
                        rotate: rotation,
                        y: -Math.min(stackOffset * 0.5, 25),
                        x: stackOffset - (visibleCards.length * 2.5),
                        opacity: 1,
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0,
                        y: -40,
                        rotate: rotation + 60
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                        delay: isNewCard
                          ? (index - (visibleCards.length - (animationState.cards?.length || 0))) * 0.1
                          : index * 0.02,
                      }}
                      style={{
                        zIndex: visibleCards.length - index + 10,
                      }}
                      whileHover={!isNewCard ? {
                        scale: 1.25,
                        y: -Math.min(stackOffset * 0.5, 25) - 20,
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
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-7xl mb-4"
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 1.5
                  }}
                >
                  🎴
                </motion.div>
                <div className="text-white/60 text-base font-medium">
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
                className="absolute inset-0 bg-red-600/30"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.6, 0.4, 0],
                }}
                transition={{ duration: 1.8 }}
              />
              
              {/* LIAR! Text with Devil */}
              <motion.div
                className="relative z-10 flex flex-col items-center gap-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.4, 1.2, 1.3],
                  rotate: [0, 10, -10, 0],
                }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  duration: 1,
                  times: [0, 0.3, 0.6, 1],
                }}
              >
                {/* Speech Bubble */}
                <div className="relative bg-white border-4 border-black rounded-2xl px-8 py-4 shadow-2xl">
                  <div className="text-red-600 text-4xl md:text-6xl font-black tracking-wider">
                    LIAR!
                  </div>
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black" />
                </div>
                
                {/* Devil Emoji */}
                <motion.div
                  className="text-6xl md:text-8xl"
                  animate={{
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: 2,
                  }}
                >
                  😈
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

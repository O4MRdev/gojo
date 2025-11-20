'use client';

import { Player as PlayerType, Card as CardType } from '@/types/game';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  isHuman: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
  onCardClick?: (card: CardType) => void;
  selectedCards: CardType[];
}

export default function Player({
  player,
  isCurrentPlayer,
  isHuman,
  position,
  onCardClick,
  selectedCards,
}: PlayerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-6xl px-4';
      case 'left':
        return 'absolute left-6 top-1/2 transform -translate-y-1/2';
      case 'top':
        return 'absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4';
      case 'right':
        return 'absolute right-6 top-1/2 transform -translate-y-1/2';
    }
  };

  const getCardLayout = () => {
    if (position === 'bottom' || position === 'top') {
      return 'flex flex-row items-center justify-center gap-3 flex-wrap max-w-full';
    }
    return 'flex flex-col items-center justify-center gap-2 max-h-[60vh] overflow-y-auto';
  };

  const isCardSelected = (card: CardType) => {
    return selectedCards.some(c => c.id === card.id);
  };

  return (
    <motion.div
      className={`${getPositionClasses()} ${isCurrentPlayer ? 'z-50' : 'z-10'}`}
      initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? 50 : position === 'top' ? -50 : 0, x: position === 'left' ? -50 : position === 'right' ? 50 : 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
        x: 0
      }}
      transition={{ duration: 0.4 }}
    >
      <div className={`
        relative rounded-2xl p-4 md:p-6 shadow-2xl border-2
        ${isCurrentPlayer 
          ? 'bg-gradient-to-br from-blue-600/95 via-blue-700/95 to-indigo-800/95 border-blue-400/60 shadow-blue-500/30' 
          : 'bg-gradient-to-br from-slate-800/90 via-gray-800/90 to-slate-900/90 border-slate-600/50'
        }
        backdrop-blur-md
      `}>
        {/* Glow effect for current player */}
        {isCurrentPlayer && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-xl -z-10"
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}

        {/* Player Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full
              ${isCurrentPlayer ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-gray-500'}
            `}>
              {isCurrentPlayer && (
                <motion.div
                  className="w-full h-full rounded-full bg-blue-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>
            <div>
              <h3 className={`font-bold text-lg md:text-xl ${isCurrentPlayer ? 'text-white' : 'text-white'}`}>
                {player.name}
              </h3>
              <p className="text-sm text-gray-200">
                {player.cards.length} {player.cards.length === 1 ? 'card' : 'cards'}
              </p>
            </div>
          </div>
          
          {isCurrentPlayer && (
            <motion.div
              className="px-4 py-2 bg-blue-600 border-2 border-white rounded-lg shadow-lg flex items-center gap-2"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 0px rgba(37, 99, 235, 0)',
                  '0 0 20px rgba(37, 99, 235, 0.6)',
                  '0 0 0px rgba(37, 99, 235, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <span className="text-white text-sm font-bold">Your Turn</span>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">👤</span>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Cards */}
        <div className={getCardLayout()}>
          <AnimatePresence mode="popLayout">
            {player.cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: -20 }}
                transition={{ 
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                layout
              >
                <Card
                  card={card}
                  isFaceUp={isHuman && position === 'bottom'}
                  isSelected={isCardSelected(card)}
                  onClick={() => onCardClick?.(card)}
                  size={position === 'bottom' ? 'medium' : 'small'}
                  zIndex={isCardSelected(card) ? 100 : index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import { Rank } from '@/types/game';
import { getRankDisplay } from '@/utils/cardUtils';
import { getRankDisplayName } from '@/utils/gameLogic';
import { motion, AnimatePresence } from 'framer-motion';

interface GameControlsProps {
  selectedCardsCount: number;
  currentRank: Rank;
  onPlayCards: () => void;
  onCallBullshit: () => void;
  canPlay: boolean;
  canCallBullshit: boolean;
}

export default function GameControls({
  selectedCardsCount,
  currentRank,
  onPlayCards,
  onCallBullshit,
  canPlay,
  canCallBullshit,
}: GameControlsProps) {
  const isPlayEnabled = canPlay && selectedCardsCount > 0 && selectedCardsCount <= 4;

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      initial={{ y: 150, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="flex gap-4 justify-center items-center">
        {/* Play Cards Button - "ADD Xx Rank" style */}
        <motion.button
          onClick={onPlayCards}
          disabled={!isPlayEnabled}
          className={`
            relative px-8 py-5 rounded-xl font-black text-white text-lg
            transition-all duration-200 overflow-hidden shadow-2xl
            ${isPlayEnabled
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-4 border-white/30'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed border-4 border-gray-500/30'
            }
          `}
          whileHover={isPlayEnabled ? { scale: 1.05, y: -3 } : {}}
          whileTap={isPlayEnabled ? { scale: 0.95 } : {}}
          animate={isPlayEnabled ? {
            boxShadow: [
              '0 10px 40px rgba(34, 197, 94, 0.4)',
              '0 15px 60px rgba(34, 197, 94, 0.6)',
              '0 10px 40px rgba(34, 197, 94, 0.4)',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {selectedCardsCount > 0 ? (
              <>
                <span>ADD {selectedCardsCount}x</span>
                <span className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                  {getRankDisplay(currentRank)}
                </span>
              </>
            ) : (
              <span>Select Cards</span>
            )}
          </span>
        </motion.button>

        {/* Bullshit Button */}
        <motion.button
          onClick={onCallBullshit}
          disabled={!canCallBullshit}
          className={`
            relative px-8 py-5 rounded-xl font-black text-white text-lg
            transition-all duration-200 overflow-hidden shadow-2xl
            ${canCallBullshit
              ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-4 border-white/30'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed border-4 border-gray-500/30'
            }
          `}
          whileHover={canCallBullshit ? { scale: 1.05, y: -3 } : {}}
          whileTap={canCallBullshit ? { scale: 0.95 } : {}}
          animate={canCallBullshit ? {
            boxShadow: [
              '0 10px 40px rgba(234, 88, 12, 0.5)',
              '0 15px 60px rgba(234, 88, 12, 0.8)',
              '0 10px 40px rgba(234, 88, 12, 0.5)',
            ],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="relative z-10">
            BULLSHIT!
          </span>
        </motion.button>
      </div>

      {/* Current Rank Indicator */}
      {canPlay && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="inline-block bg-black/60 border-2 border-white/30 rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="text-white/70 text-xs uppercase tracking-wider mb-1">
              Play {getRankDisplayName(currentRank)}
            </div>
            <div className="text-white text-sm font-semibold">
              Select 1-4 cards
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
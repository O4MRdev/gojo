import { GameState, Player, Card, Play, Rank, RANK_SEQUENCE } from '@/types/game';

export function initializeGame(playerNames: string[]): GameState {
  // This will be handled in the component
  return {
    players: [],
    currentPlayerIndex: 0,
    discardPile: [],
    lastPlay: null,
    phase: 'waiting',
    gameDirection: 1,
    selectedCards: [],
    currentRank: 'ace', // Start with Aces
    animationState: {
      type: 'none',
    },
  };
}

export function canPlayCards(cards: Card[], currentRank: Rank): boolean {
  if (cards.length === 0 || cards.length > 4) return false;
  // Players can play 1-4 cards of the current rank (or lie about it)
  return cards.length >= 1 && cards.length <= 4;
}

export function getNextPlayerIndex(currentIndex: number, numPlayers: number, direction: 1 | -1): number {
  const next = currentIndex + direction;
  if (next >= numPlayers) return 0;
  if (next < 0) return numPlayers - 1;
  return next;
}

export function getNextRank(currentRank: Rank): Rank {
  const currentIndex = RANK_SEQUENCE.indexOf(currentRank);
  const nextIndex = (currentIndex + 1) % RANK_SEQUENCE.length;
  return RANK_SEQUENCE[nextIndex];
}

export function validateBullshitCall(
  lastPlay: Play,
  actualCards: Card[]
): boolean {
  // Check if the played cards match the claimed rank
  // Return true if the play was honest (cards match claimed rank)
  return actualCards.every(card => card.rank === lastPlay.claimedRank);
}

export function checkWinCondition(players: Player[]): Player | null {
  return players.find(player => player.cards.length === 0) || null;
}

export function getRankDisplayName(rank: Rank): string {
  const rankNames: Record<Rank, string> = {
    'ace': 'Aces',
    '2': 'Twos',
    '3': 'Threes',
    '4': 'Fours',
    '5': 'Fives',
    '6': 'Sixes',
    '7': 'Sevens',
    '8': 'Eights',
    '9': 'Nines',
    '10': 'Tens',
    'jack': 'Jacks',
    'queen': 'Queens',
    'king': 'Kings',
  };
  return rankNames[rank];
}

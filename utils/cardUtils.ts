import { Card, Rank, Suit, JokerType } from '@/types/game';

export function getCardImagePath(card: Card): string {
  const suit = card.suit!;
  const rank = card.rank === 'ace' ? 'ace' : 
               card.rank === 'jack' ? 'jack' :
               card.rank === 'queen' ? 'queen' :
               card.rank === 'king' ? 'king' :
               card.rank;
  
  return `/Cards/${rank}_of_${suit}.png`;
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  const deck: Card[] = [];
  
  let id = 0;
  
  // Add regular cards (standard 52-card deck, no jokers)
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `card-${id++}`,
      });
    }
  }
  
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push([]);
  }
  
  // Deal all cards evenly
  let deckIndex = 0;
  while (deckIndex < deck.length) {
    for (let player = 0; player < numPlayers; player++) {
      if (deckIndex < deck.length) {
        hands[player].push(deck[deckIndex++]);
      }
    }
  }
  
  return hands;
}

export function getRankDisplay(rank: Rank): string {
  const rankMap: Record<Rank, string> = {
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    'jack': 'J',
    'queen': 'Q',
    'king': 'K',
    'ace': 'A',
  };
  return rankMap[rank];
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

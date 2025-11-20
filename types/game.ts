/**
 * Core Bullsh!t card-game domain types.
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank =
  | 'ace'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'jack'
  | 'queen'
  | 'king';

export const RANK_SEQUENCE: Rank[] = [
  'ace',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'jack',
  'queen',
  'king',
];

export type JokerType = 'red' | 'black';

export interface Card {
  id: string;
  rank: Rank;
  suit?: Suit;
  jokerType?: JokerType;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isHuman: boolean;
}

export interface Play {
  playerId: string;
  cards: Card[];
  claimedRank: Rank;
  claimedCount: number;
  timestamp: number;
}

export type GamePhase = 'waiting' | 'playing' | 'bullshit';

export interface AnimationState {
  type: 'none' | 'cardDrop' | 'bullshit' | 'pickup';
  cards?: Card[];
  targetPlayerId?: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  discardPile: Card[];
  lastPlay: Play | null;
  phase: GamePhase;
  gameDirection: 1 | -1;
  selectedCards: Card[];
  currentRank: Rank;
  animationState: AnimationState;
}

/**
 * Configuration for the MASTER OF THE SWORDS main menu.
 * Framework-agnostic so renderers can map the data to actual UI components.
 */
export type MenuAction =
  | 'newGame'
  | 'continue'
  | 'load'
  | 'settings'
  | 'codex'
  | 'quit';

export interface MenuIcon {
  type: 'sword' | 'crest' | 'spark';
  bladeFinish: 'obsidian' | 'silver';
  glow?: 'ember' | 'frost' | 'void';
}

export interface MenuButton {
  id: string;
  label: string;
  action: MenuAction;
  description: string;
  shortcut?: string;
  accent?: 'primary' | 'secondary' | 'warning';
  icon?: MenuIcon;
}

export interface MenuPanel {
  id: string;
  title: string;
  subtitle?: string;
  background: string;
  borderGlow: string;
  sheen?: 'vertical' | 'diagonal';
  items: MenuButton[];
}

export interface GameMenuTheme {
  palette: {
    background: string;
    surface: string;
    accent: string;
    accentSecondary: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    title: string;
    subtitle: string;
    body: string;
  };
  swords: {
    count: number;
    placement: Array<'leftGuard' | 'rightGuard' | 'center'>;
    particleTrail: 'embers' | 'sparks' | 'ashenMist';
  };
  ambient: {
    vignette: boolean;
    floatingAsh: boolean;
    bloomLevel: 0 | 1 | 2 | 3;
    hum?: 'arcane' | 'steel';
  };
}

export interface GameMenuConfig {
  title: string;
  tagline: string;
  version: string;
  theme: GameMenuTheme;
  panels: MenuPanel[];
  footer: {
    hints: string[];
    legal: string;
  };
}

export const masterOfTheSwordsMenu: GameMenuConfig = {
  title: 'MASTER OF THE SWORDS',
  tagline: 'Claim the twin blades. Rule the obsidian night.',
  version: 'v0.9.0-alpha',
  theme: {
    palette: {
      background: '#05030a', // deep violet-black
      surface: '#0f0b18',
      accent: '#d79234', // molten gold
      accentSecondary: '#6cc5ff', // tempered steel glow
      textPrimary: '#f8f2ff',
      textSecondary: '#a79fc0',
    },
    typography: {
      title: 'Cinzel Decorative, serif',
      subtitle: 'Montserrat, sans-serif',
      body: 'Inter, sans-serif',
    },
    swords: {
      count: 4,
      placement: ['leftGuard', 'rightGuard', 'center', 'center'],
      particleTrail: 'embers',
    },
    ambient: {
      vignette: true,
      floatingAsh: true,
      bloomLevel: 2,
      hum: 'steel',
    },
  },
  panels: [
    {
      id: 'primary',
      title: 'Ascend to Glory',
      subtitle: 'The night waits for a new blade master.',
      background: 'linear-gradient(135deg, #0f0b18 0%, #1b102c 60%, #2a123b 100%)',
      borderGlow: '#d79234',
      sheen: 'diagonal',
      items: [
        {
          id: 'new',
          label: 'New Saga',
          action: 'newGame',
          description: 'Forge a new oath beneath the twin moons.',
          shortcut: 'Enter',
          accent: 'primary',
          icon: {
            type: 'sword',
            bladeFinish: 'obsidian',
            glow: 'ember',
          },
        },
        {
          id: 'continue',
          label: 'Continue',
          action: 'continue',
          description: 'Resume the path where your blade last fell.',
          shortcut: 'C',
          icon: {
            type: 'sword',
            bladeFinish: 'silver',
            glow: 'void',
          },
        },
        {
          id: 'load',
          label: 'Load Chronicle',
          action: 'load',
          description: 'Invoke an engraved memory from the Codex of Echoes.',
          shortcut: 'L',
          icon: {
            type: 'crest',
            bladeFinish: 'silver',
          },
        },
      ],
    },
    {
      id: 'secondary',
      title: 'Forge & Lore',
      subtitle: 'Temper the edge. Study every myth.',
      background: 'linear-gradient(145deg, #0a0712 0%, #120b1f 50%, #1f1230 100%)',
      borderGlow: '#6cc5ff',
      sheen: 'vertical',
      items: [
        {
          id: 'settings',
          label: 'Forge Settings',
          action: 'settings',
          description: 'Tune combat, sigils, and aria intensity.',
          shortcut: 'S',
          accent: 'secondary',
          icon: {
            type: 'spark',
            bladeFinish: 'obsidian',
            glow: 'frost',
          },
        },
        {
          id: 'codex',
          label: 'Sword Codex',
          action: 'codex',
          description: 'Study relic blades and sworn foes.',
          shortcut: 'X',
          icon: {
            type: 'crest',
            bladeFinish: 'obsidian',
            glow: 'ember',
          },
        },
        {
          id: 'quit',
          label: 'Yield to Night',
          action: 'quit',
          description: 'Return to the waking world.',
          shortcut: 'Q',
          accent: 'warning',
          icon: {
            type: 'sword',
            bladeFinish: 'silver',
            glow: 'void',
          },
        },
      ],
    },
  ],
  footer: {
    hints: [
      'Only the worthy can dual‑wield the Obsidian Paradox.',
      'Hold Shift to draw both blades and reveal hidden prompts.',
      'Legends whisper that moonlit altars hide secret difficulty sigils.',
    ],
    legal: '© 2025 Umbra Anvil Studios. All blades reserved.',
  },
};

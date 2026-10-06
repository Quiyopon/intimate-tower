export type Tier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface Prompt {
  id: string;
  tier: Tier;
  text: string;
  isTimed: boolean;
  timeSeconds?: number;
}

export interface Block {
  id: string;
  layer: number; // 0 to 17 (0 is bottom, 17 is top)
  position: 0 | 1 | 2; // 0: left, 1: center, 2: right
  tier: Tier;
  isRemoved: boolean;
  orientation: 'horizontal' | 'vertical'; // alternates per layer
}

export interface Player {
  id: string;
  name: string;
  passes: number;
  score: number;
}

export interface GameState {
  blocks: Block[];
  instability: number;
  isCollapsed: boolean;
  players: Player[];
  currentPlayerIndex: number;
  activePrompt: Prompt | null;
  tierToggles: Record<Tier, boolean>;
  gameStarted: boolean;
}

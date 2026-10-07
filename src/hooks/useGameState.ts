import { useState, useEffect } from 'react';
import type { GameState, Prompt, Tier } from '../types';
import { generateBlocks, INITIAL_PASSES } from '../utils/gameLogic';
import { defaultPrompts } from '../data/defaultPrompts';

const STORAGE_KEY = 'intimate-tower-state';
const PROMPTS_KEY = 'intimate-tower-prompts';
const FORFEITS_KEY = 'intimate-tower-forfeits';

const defaultForfeits = [
  "Loser must take a body shot off the winner.",
  "Loser owes the winner a 10-minute massage right now.",
  "Loser must let the winner text anyone in their phone.",
  "Loser has to wear whatever the winner chooses for the rest of the night.",
  "Loser must buy the next round of drinks or snacks.",
  "Loser is at the winner's mercy for one custom dare."
];

export const useGameState = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem(PROMPTS_KEY);
    return saved ? JSON.parse(saved) : defaultPrompts;
  });

  const [forfeits, setForfeits] = useState<string[]>(() => {
    const saved = localStorage.getItem(FORFEITS_KEY);
    return saved ? JSON.parse(saved) : defaultForfeits;
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old state
      if (!parsed.players) {
        parsed.players = [
          { id: '1', name: 'Player 1', passes: parsed.player1Passes ?? INITIAL_PASSES, score: 0 },
          { id: '2', name: 'Player 2', passes: parsed.player2Passes ?? INITIAL_PASSES, score: 0 }
        ];
        parsed.currentPlayerIndex = (parsed.currentPlayer === 2) ? 1 : 0;
        parsed.gameStarted = true; // Assumes old games were already started
      }
      if (parsed.tierToggles && parsed.tierToggles.tier4 === undefined) {
        parsed.tierToggles.tier4 = true;
      }
      return parsed;
    }
    return {
      blocks: generateBlocks(),
      instability: 0,
      isCollapsed: false,
      players: [
        { id: '1', name: 'Player 1', passes: INITIAL_PASSES, score: 0 },
        { id: '2', name: 'Player 2', passes: INITIAL_PASSES, score: 0 }
      ],
      currentPlayerIndex: 0,
      activePrompt: null,
      tierToggles: { tier1: true, tier2: true, tier3: true, tier4: true },
      gameStarted: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem(FORFEITS_KEY, JSON.stringify(forfeits));
  }, [forfeits]);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev: GameState) => ({ ...prev, ...updates }));
  };

  const resetGame = () => {
    updateGameState({
      blocks: generateBlocks(),
      instability: 0,
      isCollapsed: false,
      currentPlayerIndex: 0,
      activePrompt: null,
      players: gameState.players.map(p => ({ ...p, passes: INITIAL_PASSES, score: 0 }))
    });
  };

  const resetPrompts = () => {
    setPrompts(defaultPrompts);
  };

  const addPrompt = (prompt: Prompt) => {
    setPrompts((prev) => [...prev, prompt]);
  };

  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const addForfeit = (forfeit: string) => {
    setForfeits((prev) => [...prev, forfeit]);
  };

  const deleteForfeit = (forfeit: string) => {
    setForfeits((prev) => prev.filter((f) => f !== forfeit));
  };

  const getRandomPrompt = (tier: Tier) => {
    const tierPrompts = prompts.filter((p) => p.tier === tier);
    if (tierPrompts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tierPrompts.length);
    return tierPrompts[randomIndex];
  };

  return {
    gameState,
    updateGameState,
    resetGame,
    prompts,
    resetPrompts,
    addPrompt,
    deletePrompt,
    getRandomPrompt,
    forfeits,
    addForfeit,
    deleteForfeit,
  };
};

import { useState, useEffect } from 'react';
import type { GameState, Prompt, Tier } from '../types';
import { generateBlocks, INITIAL_PASSES } from '../utils/gameLogic';
import { defaultPrompts } from '../data/defaultPrompts';

const STORAGE_KEY = 'intimate-tower-state';
const PROMPTS_KEY = 'intimate-tower-prompts';

export const useGameState = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    const saved = localStorage.getItem(PROMPTS_KEY);
    return saved ? JSON.parse(saved) : defaultPrompts;
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      blocks: generateBlocks(),
      instability: 0,
      isCollapsed: false,
      player1Passes: INITIAL_PASSES,
      player2Passes: INITIAL_PASSES,
      currentPlayer: 1,
      activePrompt: null,
      tierToggles: { tier1: true, tier2: true, tier3: true },
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev: GameState) => ({ ...prev, ...updates }));
  };

  const resetGame = () => {
    updateGameState({
      blocks: generateBlocks(),
      instability: 0,
      isCollapsed: false,
      player1Passes: INITIAL_PASSES,
      player2Passes: INITIAL_PASSES,
      currentPlayer: 1,
      activePrompt: null,
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
  };
};

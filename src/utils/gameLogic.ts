import type { Block, Tier } from '../types';

export const INITIAL_PASSES = 2;

export const generateBlocks = (): Block[] => {
  const blocks: Block[] = [];
  // 18 layers (0 to 17), 3 blocks per layer
  for (let layer = 0; layer < 18; layer++) {
    // Top 6 layers (12-17): Tier 1
    // Middle 6 layers (6-11): Tier 2
    // Bottom 6 layers (0-5): Tier 3
    let tier: Tier = 'tier3';
    if (layer >= 12) tier = 'tier1';
    else if (layer >= 6) tier = 'tier2';

    const orientation = layer % 2 === 0 ? 'horizontal' : 'vertical';

    for (let pos = 0; pos < 3; pos++) {
      blocks.push({
        id: `block-${layer}-${pos}`,
        layer,
        position: pos as 0 | 1 | 2,
        tier,
        isRemoved: false,
        orientation,
      });
    }
  }
  return blocks;
};

// Returns boolean indicating if tower collapses
export const checkCollapse = (currentInstability: number): boolean => {
  const roll = Math.random() * 100;
  return roll < currentInstability;
};

export const calculateInstabilityIncrease = (position: 0 | 1 | 2): number => {
  // Outer blocks (0, 2): +3% to +5%
  // Middle block (1): +10% to +14%
  if (position === 1) {
    return Math.floor(Math.random() * 5) + 10; // 10, 11, 12, 13, 14
  } else {
    return Math.floor(Math.random() * 3) + 3; // 3, 4, 5
  }
};

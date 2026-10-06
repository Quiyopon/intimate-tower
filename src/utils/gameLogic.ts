import type { Block, Tier } from '../types';

export const INITIAL_PASSES = 2;

export const generateBlocks = (): Block[] => {
  const blocks: Block[] = [];
  
  // Create a pool of 42 tiers
  const tierPool: Tier[] = [
    ...Array(11).fill('tier1'),
    ...Array(11).fill('tier2'),
    ...Array(10).fill('tier3'),
    ...Array(10).fill('tier4')
  ];

  // Fisher-Yates shuffle the tier pool
  for (let i = tierPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tierPool[i], tierPool[j]] = [tierPool[j], tierPool[i]];
  }

  let blockIndex = 0;
  for (let layer = 0; layer < 14; layer++) {
    const orientation = layer % 2 === 0 ? 'horizontal' : 'vertical';

    for (let pos = 0; pos < 3; pos++) {
      blocks.push({
        id: `block-${layer}-${pos}`,
        layer,
        position: pos as 0 | 1 | 2,
        tier: tierPool[blockIndex++],
        isRemoved: false,
        orientation,
      });
    }
  }
  return blocks;
};

// Physics Engine
export interface PhysicsResult {
  collapsed: boolean;
  minMargin: number;
}

export const calculatePhysics = (blocks: Block[]): PhysicsResult => {
  // Only consider blocks that are part of the tower
  const activeBlocks = blocks.filter(b => !b.isRemoved);
  if (activeBlocks.length === 0) return { collapsed: false, minMargin: 1.5 };

  const maxLayer = Math.max(...activeBlocks.map(b => b.layer));
  let minMargin = 1.5;

  // We check each layer L, to see if it can support all blocks ABOVE it
  for (let L = 0; L < maxLayer; L++) {
    const layerBlocks = activeBlocks.filter(b => b.layer === L);
    const blocksAbove = activeBlocks.filter(b => b.layer > L);
    
    if (blocksAbove.length === 0) continue;
    
    // If a layer has no blocks but there are blocks above it, it's floating! (Impossible in real game, but mathematically collapses)
    if (layerBlocks.length === 0) return { collapsed: true, minMargin: -1 };

    // Calculate CoG of all blocks above L
    let sumX = 0;
    let sumZ = 0;
    
    for (const b of blocksAbove) {
      const isHoriz = b.orientation === 'horizontal';
      // In our coordinate system:
      // Horizontal blocks span X (-1.5 to 1.5). They vary in Z: pos 0 is -1, pos 1 is 0, pos 2 is 1.
      // Vertical blocks span Z (-1.5 to 1.5). They vary in X: pos 0 is -1, pos 1 is 0, pos 2 is 1.
      const offset = b.position - 1; // -1, 0, 1
      if (isHoriz) {
        sumZ += offset;
      } else {
        sumX += offset;
      }
    }
    
    const cogX = sumX / blocksAbove.length;
    const cogZ = sumZ / blocksAbove.length;

    // Calculate support base of layer L
    const isLHoriz = layerBlocks[0].orientation === 'horizontal';
    
    // Check support array
    const has0 = layerBlocks.some(b => b.position === 0);
    const has1 = layerBlocks.some(b => b.position === 1);
    const has2 = layerBlocks.some(b => b.position === 2);
    
    // The width axis is Z for horizontal, X for vertical
    const minPos = has0 ? -1.5 : (has1 ? -0.5 : 0.5);
    const maxPos = has2 ? 1.5 : (has1 ? 0.5 : -0.5);
    
    // The length axis is fully supported [-1.5, 1.5]
    let margin = 0;
    if (isLHoriz) {
      // Width is along Z. CoG Z must be in [minPos, maxPos], CoG X must be in [-1.5, 1.5]
      const marginZ = Math.min(cogZ - minPos, maxPos - cogZ);
      const marginX = Math.min(cogX - (-1.5), 1.5 - cogX);
      margin = Math.min(marginZ, marginX);
    } else {
      // Width is along X. CoG X must be in [minPos, maxPos], CoG Z must be in [-1.5, 1.5]
      const marginX = Math.min(cogX - minPos, maxPos - cogX);
      const marginZ = Math.min(cogZ - (-1.5), 1.5 - cogZ);
      margin = Math.min(marginX, marginZ);
    }
    
    minMargin = Math.min(minMargin, margin);
    
    // If CoG is outside support base, it collapses
    if (margin < 0) {
      return { collapsed: true, minMargin };
    }
  }

  return { collapsed: false, minMargin };
};




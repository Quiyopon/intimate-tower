import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Block, Tier } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TowerProps {
  blocks: Block[];
  onPullBlock: (block: Block) => void;
  isCollapsed: boolean;
}

export function Tower({ blocks, onPullBlock, isCollapsed }: TowerProps) {
  const [shakingBlockId, setShakingBlockId] = useState<string | null>(null);

  // Group blocks by layer (0 is bottom, 17 is top)
  const layers = Array.from({ length: 18 }, (_, i) => 17 - i).map((layerIndex) => {
    return blocks.filter((b) => b.layer === layerIndex).sort((a, b) => a.position - b.position);
  });

  const getTierColors = (tier: Tier) => {
    switch (tier) {
      case 'tier1':
        return 'bg-rose-500 shadow-rose-900/50 hover:bg-rose-400';
      case 'tier2':
        return 'bg-amber-500 shadow-amber-900/50 hover:bg-amber-400';
      case 'tier3':
        return 'bg-purple-600 shadow-purple-900/50 hover:bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getTierAccent = (tier: Tier) => {
    switch (tier) {
      case 'tier1':
        return 'border-rose-400/50';
      case 'tier2':
        return 'border-amber-400/50';
      case 'tier3':
        return 'border-purple-400/50';
      default:
        return 'border-slate-400/50';
    }
  };

  const handleBlockClick = (block: Block) => {
    if (block.isRemoved || isCollapsed) return;
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setShakingBlockId(block.id);
    setTimeout(() => {
      setShakingBlockId(null);
      onPullBlock(block);
    }, 400); // Wait for pull animation
  };

  return (
    <div className={cn(
      "w-full max-w-[280px] mx-auto perspective-container relative mt-8",
      isCollapsed && "crumble-animation"
    )}>
      <div className="preserve-3d flex flex-col items-center gap-[2px]">
        {layers.map((layerBlocks, idx) => (
          <div key={idx} className="flex gap-[2px] h-[22px] w-full justify-center">
            {layerBlocks.map((block) => {
              const isShaking = shakingBlockId === block.id;
              
              // To give 3D illusion, alternate horizontal/vertical look
              // Horizontal: wide rectangles. Vertical: narrow squares.
              // In 2D, we'll just vary the inner shading/borders.
              const isHorizontal = block.orientation === 'horizontal';

              return (
                <button
                  key={block.id}
                  onClick={() => handleBlockClick(block)}
                  disabled={block.isRemoved || isCollapsed || isShaking}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    "w-[32%] h-full rounded-[2px]",
                    "border-t border-l border-b-2 border-r-2",
                    getTierColors(block.tier),
                    getTierAccent(block.tier),
                    block.isRemoved ? "opacity-0 pointer-events-none scale-90" : "opacity-100",
                    isShaking && "scale-105 z-10 -translate-x-4 opacity-50",
                    isHorizontal ? "bg-gradient-to-r from-black/20 via-transparent to-black/20" : "bg-gradient-to-b from-transparent to-black/20"
                  )}
                  style={{
                    boxShadow: block.isRemoved ? 'none' : 'inset 1px 1px 2px rgba(255,255,255,0.2), 2px 2px 4px var(--tw-shadow-color)'
                  }}
                >
                  <div className={cn(
                    "absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"
                  )} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

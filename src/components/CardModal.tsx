import { useState, useEffect } from 'react';
import type { Prompt, Tier } from '../types';
import { cn } from './Tower';
import { Timer, CheckCircle, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardModalProps {
  prompt: Prompt;
  currentPlayer: string;
  passesAvailable: number;
  onComplete: () => void;
  onPass: () => void;
}
export function CardModal({ prompt, currentPlayer, passesAvailable, onComplete, onPass }: CardModalProps) {
  const [timeLeft, setTimeLeft] = useState(prompt.timeSeconds || 0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setTimeLeft(prompt.timeSeconds || 0);
    setIsActive(false);
  }, [prompt]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const getTierColors = (tier: Tier) => {
    switch (tier) {
      case 'tier1': return 'from-amber-900/90 to-amber-950 border-amber-500/50 text-amber-100 shadow-amber-900/50';
      case 'tier2': return 'from-orange-900/90 to-orange-950 border-orange-500/50 text-orange-100 shadow-orange-900/50';
      case 'tier3': return 'from-red-900/90 to-red-950 border-red-500/50 text-red-100 shadow-red-900/50';
      case 'tier4': return 'from-rose-900/90 to-rose-950 border-rose-600/50 text-rose-100 shadow-rose-900/50';
      default: return 'from-slate-900 to-slate-950 border-slate-500 text-slate-100';
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "w-full max-w-sm rounded-3xl p-6 border shadow-2xl bg-gradient-to-br flex flex-col",
          getTierColors(prompt.tier)
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-bold uppercase tracking-wider opacity-80">
            {currentPlayer}'s Turn
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/30 border border-white/10 uppercase tracking-widest">
            {prompt.tier.replace('tier', 'Level ')}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-[160px] mb-8">
          <p className="text-2xl font-medium text-center leading-relaxed">
            {prompt.text}
          </p>
        </div>

        {prompt.isTimed && (
          <div className="mb-8 flex flex-col items-center">
            <div className="text-4xl font-mono font-bold tracking-wider mb-4 font-variant-numeric: tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={toggleTimer}
              disabled={timeLeft === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all w-full justify-center text-lg",
                isActive ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-white/20 hover:bg-white/30 text-white",
                timeLeft === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <Timer className="w-5 h-5" />
              {timeLeft === 0 ? "Time's Up!" : isActive ? "Pause" : "Start Timer"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={onPass}
            disabled={passesAvailable <= 0}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all font-semibold",
              passesAvailable > 0 
                ? "bg-black/30 hover:bg-black/40 text-white" 
                : "bg-black/10 text-white/30 cursor-not-allowed"
            )}
          >
            <SkipForward className="w-5 h-5 mb-1" />
            <span>Pass Token</span>
            <span className="text-xs font-normal opacity-70">({passesAvailable} left)</span>
          </button>
          
          <button
            onClick={onComplete}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-white text-black hover:bg-gray-100 transition-all font-bold"
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span>Complete</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

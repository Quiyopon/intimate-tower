import { useState, useEffect } from 'react';
import type { Prompt, Tier } from '../types';
import { cn } from './Tower';
import { Timer, CheckCircle, SkipForward, XCircle } from 'lucide-react';
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
      case 'tier1': return 'from-[#2a1a08] to-[#140c04] border-amber-500/40 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.2)]';
      case 'tier2': return 'from-[#3a1d12] to-[#1a0c08] border-orange-500/40 text-orange-100 shadow-[0_0_40px_rgba(249,115,22,0.2)]';
      case 'tier3': return 'from-[#381122] to-[#1c0811] border-rose-500/40 text-rose-100 shadow-[0_0_40px_rgba(225,29,72,0.2)]';
      case 'tier4': return 'from-[#2e092b] to-[#150413] border-fuchsia-500/40 text-fuchsia-100 shadow-[0_0_40px_rgba(217,70,239,0.2)]';
      default: return 'from-slate-900 to-slate-950 border-slate-500 text-slate-100';
    }
  };

  const getTierLabel = (tier: Tier) => {
    switch (tier) {
      case 'tier1': return 'Level 1: Mild & Sensual';
      case 'tier2': return 'Level 2: Spicy & Disrobing';
      case 'tier3': return 'Level 3: Intimate & Explicit';
      case 'tier4': return 'Level 4: Oral & Extreme';
      default: return 'Level 0';
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "w-[90%] max-w-lg rounded-3xl p-6 sm:p-8 border-2 bg-gradient-to-br flex flex-col relative overflow-hidden",
          getTierColors(prompt.tier)
        )}
      >
        {/* Decorative background glow inside the card */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

        <div className="flex flex-col items-center justify-center mb-8 relative z-10">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-1.5 rounded-full mb-3">
            <span className="text-sm font-black uppercase tracking-widest text-white/90">
              {currentPlayer}'s Turn
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">
            {getTierLabel(prompt.tier)}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-[180px] mb-8 relative z-10">
          <p className="text-2xl sm:text-3xl font-medium text-center leading-snug drop-shadow-md">
            {prompt.text}
          </p>
        </div>

        {prompt.isTimed && (
          <div className="mb-8 flex flex-col items-center relative z-10">
            <div className="text-5xl font-mono font-black tracking-wider mb-4 font-variant-numeric: tabular-nums drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={toggleTimer}
              disabled={timeLeft === 0}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all w-full max-w-[240px] justify-center text-lg uppercase tracking-wider",
                isActive ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30" : "bg-white/20 hover:bg-white/30 text-white border border-white/20",
                timeLeft === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <Timer className="w-6 h-6" />
              {timeLeft === 0 ? "Time's Up!" : isActive ? "Pause" : "Start Timer"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-auto relative z-10">
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white hover:brightness-110 transition-all font-black text-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] active:scale-95 uppercase tracking-wider"
          >
            <CheckCircle className="w-6 h-6" />
            Complete
          </button>
          
          <button
            onClick={onPass}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl transition-all font-bold text-lg active:scale-95 border",
              passesAvailable > 0 
                ? "bg-black/40 hover:bg-black/60 text-white border-white/20" 
                : "bg-red-950/50 hover:bg-red-900/60 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            )}
          >
            {passesAvailable > 0 ? (
              <>
                <SkipForward className="w-5 h-5" />
                Pass Token ({passesAvailable} left)
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                Forfeit / Veto
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import type { Player } from '../types';
import { INITIAL_PASSES } from '../utils/gameLogic';

interface TitleScreenProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  onStart: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const NeonTowerIcon = () => (
  <svg viewBox="0 0 100 120" className="w-[72px] h-[86px] text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]">
    <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      {/* Top face */}
      <path d="M50 5 L85 20 L50 35 L15 20 Z" />
      
      {/* Left and Right faces of layers */}
      {/* Layer 1 */}
      <path d="M15 20 V 35 L50 50 V 35" />
      <path d="M85 20 V 35 L50 50" />
      {/* Layer 2 */}
      <path d="M15 35 V 50 L50 65 V 50" />
      <path d="M85 35 V 50 L50 65" />
      {/* Layer 3 */}
      <path d="M15 50 V 65 L50 80 V 65" />
      <path d="M85 50 V 65 L50 80" />
      {/* Layer 4 */}
      <path d="M15 65 V 80 L50 95 V 80" />
      <path d="M85 65 V 80 L50 95" />

      {/* Cross lines to simulate pieces */}
      <path d="M38 10 L73 25" />
      <path d="M27 15 L62 30" />
      {/* Vertical splits for alternating layers */}
      {/* Layer 1 (front face split) */}
      <path d="M32 28 V 43" />
      <path d="M68 28 V 43" />
      {/* Layer 2 (side splits) */}
      <path d="M50 50 V 65" />
      {/* Layer 3 */}
      <path d="M32 58 V 73" />
      <path d="M68 58 V 73" />
      {/* Layer 4 */}
      <path d="M50 80 V 95" />
    </g>
  </svg>
);

export function TitleScreen({ players, onUpdatePlayers, onStart, onOpenSettings, isMuted, onToggleMute }: TitleScreenProps) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      passes: INITIAL_PASSES,
      score: 0
    };
    onUpdatePlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    onUpdatePlayers(players.filter(p => p.id !== id));
  };

  const isGameReady = players.length >= 2;

  return (
    <div className="absolute inset-0 z-50 bg-[#05050f] text-slate-100 flex flex-col items-center p-6 overflow-y-auto">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar - Controls */}
      <div className="w-full max-w-lg flex justify-end gap-3 z-10 pt-2">
        <button 
          onClick={onToggleMute}
          className="w-12 h-12 flex items-center justify-center bg-purple-900/30 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-full border border-purple-500/30 transition-all shadow-[0_0_15px_rgba(147,51,234,0.15)]"
          aria-label="Toggle Volume"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-12 h-12 flex items-center justify-center bg-purple-900/30 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-full border border-purple-500/30 transition-all shadow-[0_0_15px_rgba(147,51,234,0.15)]"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-sm flex-1 flex flex-col pt-8 pb-4 z-10">
        
        {/* Title & Branding */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex flex-col text-right">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-none">
              INTIMATE
            </h1>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-none mt-1">
              TOWER
            </h1>
          </div>
          <NeonTowerIcon />
        </div>

        <p className="text-slate-300 text-center text-sm font-medium mb-4">
          Add players to begin (2-8 players)
        </p>

        {/* Add Player Input */}
        <form onSubmit={handleAddPlayer} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Player Name..."
            className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-lg shadow-inner"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 text-white font-black px-6 py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] disabled:shadow-none hover:brightness-110 active:scale-95 text-lg uppercase tracking-wider"
          >
            Add
          </button>
        </form>

        {/* Player List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-semibold text-slate-400">
              {players.length} {players.length === 1 ? 'Player' : 'Players'} added
            </span>
            {players.length > 0 && players.length < 2 && (
              <span className="text-sm font-semibold text-pink-400 animate-pulse">
                Need at least 2
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-4">
            <AnimatePresence>
              {players.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center text-slate-600 py-10 italic font-medium"
                >
                  No players yet. Invite some friends!
                </motion.div>
              ) : (
                players.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 px-5 py-4 rounded-2xl group shadow-lg"
                  >
                    <span className="font-bold text-lg">{player.name}</span>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white p-2 rounded-full transition-all active:scale-90"
                      aria-label={`Remove ${player.name}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Start Game CTA */}
        <div className="pt-4 mt-auto">
          <button
            onClick={onStart}
            disabled={!isGameReady}
            className={`w-full flex items-center justify-center gap-3 font-black py-5 rounded-2xl transition-all duration-300 text-xl uppercase tracking-wider ${
              isGameReady 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] hover:brightness-110 active:scale-95' 
                : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-70 cursor-not-allowed'
            }`}
          >
            Start Game
            <ArrowRight className={`w-6 h-6 ${isGameReady ? 'animate-pulse' : ''}`} />
          </button>
        </div>
        
      </div>
    </div>
  );
}

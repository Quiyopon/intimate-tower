import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X, Play, Settings, Volume2, VolumeX } from 'lucide-react';
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

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 text-center bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={onToggleMute}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-rose-500/20">
            IT
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-400">
            Intimate Tower
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Add players to begin</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          <form onSubmit={handleAddPlayer} className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player Name..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newPlayerName.trim()}
              className="bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-50 px-4 rounded-lg font-bold transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </form>

          <div className="flex-1 min-h-[150px] max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {players.length === 0 ? (
              <div className="text-center text-slate-500 py-8 italic">No players added yet</div>
            ) : (
              players.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg group"
                >
                  <span className="font-semibold">{player.name}</span>
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          <button
            onClick={onStart}
            disabled={players.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-rose-500/20 disabled:shadow-none hover:opacity-90 active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import type { Prompt, Tier } from '../types';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  onClose: () => void;
  tierToggles: Record<Tier, boolean>;
  onToggleTier: (tier: Tier) => void;
  prompts: Prompt[];
  onAddPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
  onResetPrompts: () => void;
  onResetGame: () => void;
}

export function SettingsModal({
  onClose,
  tierToggles,
  onToggleTier,
  prompts,
  onAddPrompt,
  onDeletePrompt,
  onResetPrompts,
  onResetGame,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tiers' | 'prompts' | 'game'>('tiers');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTier, setNewPromptTier] = useState<Tier>('tier1');
  const [newPromptIsTimed, setNewPromptIsTimed] = useState(false);
  const [newPromptTime, setNewPromptTime] = useState(60);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleTier = (tier: Tier) => {
    const activeCount = Object.values(tierToggles).filter(Boolean).length;
    if (tierToggles[tier] && activeCount === 1) {
      showToast("At least one tier must remain active!");
      return;
    }
    onToggleTier(tier);
  };

  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    onAddPrompt({
      id: Math.random().toString(36).substring(2, 9),
      tier: newPromptTier,
      text: newPromptText.trim(),
      isTimed: newPromptIsTimed,
      timeSeconds: newPromptIsTimed ? newPromptTime : undefined,
    });
    setNewPromptText('');
    showToast("Prompt added successfully!");
  };

  const getTierStyles = (tier: Tier) => {
    switch (tier) {
      case 'tier1': return { container: 'text-amber-400 bg-amber-400/10 border-amber-400/40', thumb: 'bg-amber-400', track: 'bg-amber-900/60 border-amber-400/30' };
      case 'tier2': return { container: 'text-orange-500 bg-orange-500/10 border-orange-500/40', thumb: 'bg-orange-500', track: 'bg-orange-900/60 border-orange-500/30' };
      case 'tier3': return { container: 'text-red-500 bg-red-500/10 border-red-500/40', thumb: 'bg-red-500', track: 'bg-red-900/60 border-red-500/30' };
      case 'tier4': return { container: 'text-rose-600 bg-rose-600/10 border-rose-600/40', thumb: 'bg-rose-500', track: 'bg-rose-900/60 border-rose-500/30' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end md:justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-[440px] mx-auto bg-slate-900 md:border border-slate-700 md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col h-[88vh] md:h-[80vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl"
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-slate-800/50">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-4 pt-4 bg-slate-900 border-b border-slate-800 gap-2">
          {(['tiers', 'prompts', 'game'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-t-xl transition-all flex-1 ${
                activeTab === tab 
                  ? 'bg-slate-800 text-pink-400 border-t-2 border-pink-500' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-t-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-safe-8">
          
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg z-50 whitespace-nowrap text-sm"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'tiers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Toggle which tiers of dares are included in the game. Note: If a tier is disabled, pulling its block does nothing but increase instability.
              </p>
              {(['tier1', 'tier2', 'tier3', 'tier4'] as Tier[]).map(tier => {
                const styles = getTierStyles(tier);
                const isActive = tierToggles[tier];
                return (
                  <button
                    key={tier} 
                    onClick={() => handleToggleTier(tier)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group active:scale-95 ${
                      isActive ? styles.container : 'border-slate-800 bg-slate-900/50 text-slate-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <h3 className={`font-black uppercase tracking-wider ${isActive ? '' : 'text-slate-400'}`}>
                        {tier.replace('tier', 'Level ')}
                      </h3>
                      <p className={`text-xs mt-1 font-medium ${isActive ? 'opacity-80' : 'text-slate-500'}`}>
                        {tier === 'tier1' ? 'Mild & Sensual' : tier === 'tier2' ? 'Spicy & Disrobing' : tier === 'tier3' ? 'Intimate & Explicit' : 'Oral & Extreme'}
                      </p>
                    </div>
                    <div
                      className={`w-14 h-8 rounded-full transition-colors relative border flex items-center px-1 ${
                        isActive ? styles.track : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full transition-transform shadow-md ${
                        isActive ? `translate-x-6 ${styles.thumb}` : 'translate-x-0 bg-slate-500'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'prompts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700">
                <h3 className="font-bold mb-4 text-white uppercase tracking-wider text-sm">Add Custom Prompt</h3>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Enter your dare..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-pink-500 min-h-[100px] mb-4 placeholder-slate-500 resize-none"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={newPromptTier}
                    onChange={(e) => setNewPromptTier(e.target.value as Tier)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none flex-1 text-slate-200"
                  >
                    <option value="tier1">Level 1 - Mild</option>
                    <option value="tier2">Level 2 - Spicy</option>
                    <option value="tier3">Level 3 - Intimate</option>
                    <option value="tier4">Level 4 - Extreme</option>
                  </select>
                  <label className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer text-slate-200 select-none">
                    <input
                      type="checkbox"
                      checked={newPromptIsTimed}
                      onChange={(e) => setNewPromptIsTimed(e.target.checked)}
                      className="accent-pink-500 w-4 h-4"
                    />
                    <span className="font-semibold">Timed</span>
                  </label>
                </div>
                {newPromptIsTimed && (
                  <div className="mt-3 flex items-center justify-between bg-slate-900 border border-slate-700 p-3 rounded-xl">
                    <span className="text-sm font-semibold text-slate-400">Duration (seconds):</span>
                    <input
                      type="number"
                      value={newPromptTime}
                      onChange={(e) => setNewPromptTime(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-center w-20 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                )}
                <button
                  onClick={handleAddPrompt}
                  disabled={!newPromptText.trim()}
                  className="w-full mt-5 bg-gradient-to-r from-pink-500 to-purple-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 hover:brightness-110 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wider shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Add Prompt
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold mb-3 flex justify-between items-center px-1">
                  <span className="uppercase tracking-wider text-sm text-slate-300">Existing ({prompts.length})</span>
                  <button onClick={onResetPrompts} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Defaults
                  </button>
                </h3>
                <div className="space-y-2">
                  {prompts.map(prompt => {
                    const styles = getTierStyles(prompt.tier);
                    return (
                      <div key={prompt.id} className="bg-slate-800/80 p-4 rounded-2xl flex items-start gap-3 border border-slate-700/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${styles.container}`}>
                              {prompt.tier.replace('tier', 'Lvl ')}
                            </span>
                            {prompt.isTimed && (
                              <span className="text-[10px] text-slate-300 font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                                {prompt.timeSeconds}s
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-200" title={prompt.text}>{prompt.text}</p>
                        </div>
                        <button
                          onClick={() => onDeletePrompt(prompt.id)}
                          className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-full transition-colors shrink-0"
                          aria-label="Delete prompt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'game' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">
              <div className="bg-red-950/30 border border-red-500/20 p-5 rounded-3xl text-center">
                <h3 className="text-red-400 font-bold mb-2 uppercase tracking-wider text-sm">Danger Zone</h3>
                <p className="text-slate-400 text-sm mb-6">This will reset all player scores and start a fresh tower.</p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset the current game?')) {
                      onResetGame();
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50 p-4 rounded-xl font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" /> Reset Progress
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

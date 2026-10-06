import { useState } from 'react';
import type { Prompt, Tier } from '../types';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

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
  };

  const getTierColor = (tier: Tier) => {
    switch (tier) {
      case 'tier1': return 'text-rose-400 bg-rose-400/10 border-rose-400/30';
      case 'tier2': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'tier3': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col h-[85vh] shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-2 pt-2 border-b border-slate-800 gap-2">
          {(['tiers', 'prompts', 'game'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold capitalize rounded-t-lg transition-colors flex-1 ${
                activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-6">
                Toggle which tiers of dares are included in the game. Note: If a tier is disabled, pulling its block does nothing but increase instability.
              </p>
              {(['tier1', 'tier2', 'tier3'] as Tier[]).map(tier => (
                <div key={tier} className={`flex items-center justify-between p-4 rounded-2xl border ${getTierColor(tier)}`}>
                  <div>
                    <h3 className="font-bold capitalize">{tier.replace('tier', 'Level ')}</h3>
                    <p className="text-xs opacity-80 mt-1">
                      {tier === 'tier1' ? 'Mild & Sensual' : tier === 'tier2' ? 'Spicy & Disrobing' : 'Intimate & Explicit'}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleTier(tier)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${tierToggles[tier] ? 'bg-white' : 'bg-black/50'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform bg-current ${tierToggles[tier] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <h3 className="font-bold mb-3">Add Custom Prompt</h3>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Enter your dare..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[80px]"
                />
                <div className="flex gap-2 mt-3">
                  <select
                    value={newPromptTier}
                    onChange={(e) => setNewPromptTier(e.target.value as Tier)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:outline-none flex-1"
                  >
                    <option value="tier1">Level 1</option>
                    <option value="tier2">Level 2</option>
                    <option value="tier3">Level 3</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPromptIsTimed}
                      onChange={(e) => setNewPromptIsTimed(e.target.checked)}
                      className="accent-rose-500"
                    />
                    Timed
                  </label>
                </div>
                {newPromptIsTimed && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-slate-400">Seconds:</span>
                    <input
                      type="number"
                      value={newPromptTime}
                      onChange={(e) => setNewPromptTime(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm w-20 focus:outline-none"
                    />
                  </div>
                )}
                <button
                  onClick={handleAddPrompt}
                  disabled={!newPromptText.trim()}
                  className="w-full mt-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Prompt
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold mb-2 flex justify-between items-center">
                  <span>Existing Prompts ({prompts.length})</span>
                  <button onClick={onResetPrompts} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Restore Defaults
                  </button>
                </h3>
                {prompts.map(prompt => (
                  <div key={prompt.id} className="bg-slate-800 p-3 rounded-xl flex items-start gap-3 border border-slate-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getTierColor(prompt.tier)}`}>
                          {prompt.tier.replace('tier', 'Lvl ')}
                        </span>
                        {prompt.isTimed && (
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                            {prompt.timeSeconds}s
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate" title={prompt.text}>{prompt.text}</p>
                    </div>
                    <button
                      onClick={() => onDeletePrompt(prompt.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="space-y-4 pt-4">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset the current game?')) {
                    onResetGame();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 p-4 rounded-2xl font-bold transition-colors"
              >
                <RotateCcw className="w-5 h-5" /> Reset Game Progress
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

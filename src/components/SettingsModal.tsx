import { useState } from 'react';
import type { Prompt, Tier } from '../types';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

interface SettingsModalProps {
  onClose: () => void;
  tierToggles: Record<Tier, boolean>;
  onToggleTier: (tier: Tier) => void;
  prompts: Prompt[];
  onAddPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
  onResetPrompts: () => void;
  onResetGame: () => void;
  forfeits: string[];
  onAddForfeit: (forfeit: string) => void;
  onDeleteForfeit: (forfeit: string) => void;
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
  forfeits,
  onAddForfeit,
  onDeleteForfeit,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tiers' | 'prompts' | 'game'>('tiers');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTier, setNewPromptTier] = useState<Tier>('tier1');
  const [newPromptIsTimed, setNewPromptIsTimed] = useState(false);
  const [newPromptTime, setNewPromptTime] = useState(60);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [promptFilter, setPromptFilter] = useState<Tier | 'all'>('all');
  const [promptPage, setPromptPage] = useState(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newForfeitText, setNewForfeitText] = useState('');
  const PROMPTS_PER_PAGE = 5;

  const activeColors = useThemeStore((state) => state.getActiveColors());
  const { theme, setTheme, setCustomColor } = useThemeStore();

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

  const handleAddForfeit = () => {
    if (!newForfeitText.trim()) return;
    if (forfeits.includes(newForfeitText.trim())) {
      showToast("This forfeit already exists!");
      return;
    }
    onAddForfeit(newForfeitText.trim());
    setNewForfeitText('');
    showToast("Forfeit added successfully!");
  };

  const getTierStyles = (tier: Tier, isActive: boolean) => {
    if (!isActive) return {};
    
    // Deep velvet UI for settings menu toggles
    return {
      container: { 
        color: '#fff1f2', // rose-50
        backgroundColor: '#4c0519', // rose-950
        borderColor: '#881337' // rose-900
      },
      track: { 
        backgroundColor: '#2a0410', // extremely dark red
        borderColor: '#881337' 
      },
      thumb: { 
        backgroundColor: '#f43f5e', // rose-500 (10% Accent)
        border: '1px solid #fb7185' // rose-400
      }
    };
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

        <div className="flex px-4 pt-4 bg-slate-900 z-20 relative border-b border-slate-800 gap-2">
          {(['tiers', 'prompts', 'game'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-t-xl transition-all flex-1 ${
                activeTab === tab 
                  ? 'bg-rose-950/20 text-rose-200 border-t-2 border-rose-800' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-t-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
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
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Toggle which tiers of dares are included in the game. Note: If a tier is disabled, pulling its block does nothing but increase instability.
              </p>
              


              {(['tier1', 'tier2', 'tier3', 'tier4'] as Tier[]).map(tier => {
                const isActive = tierToggles[tier];
                const styles = getTierStyles(tier, isActive);
                return (
                  <div
                    key={tier} 
                    onClick={() => handleToggleTier(tier)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group cursor-pointer active:scale-95 ${
                      isActive ? '' : 'border-slate-800 bg-slate-900/50 text-slate-500 opacity-60 hover:opacity-100'
                    }`}
                    style={styles.container}
                  >
                    <div>
                      <h3 className={`font-black uppercase tracking-wider ${isActive ? '' : 'text-slate-400'}`}>
                        {tier.replace('tier', 'Level ')}
                      </h3>
                      <p className={`text-xs mt-1 font-medium ${isActive ? 'opacity-80' : 'text-slate-500'}`}>
                        {tier === 'tier1' ? 'Mild & Sensual' : tier === 'tier2' ? 'Spicy & Disrobing' : tier === 'tier3' ? 'Intimate & Explicit' : 'Oral & Extreme'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {theme === 'custom' && (
                        <input
                          type="color"
                          value={activeColors[tier]}
                          onChange={(e) => {
                            e.stopPropagation();
                            setCustomColor(tier, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full border-0 cursor-pointer overflow-hidden p-0"
                        />
                      )}
                      <div
                        className={`w-14 h-8 rounded-full transition-colors relative border flex items-center px-1 ${
                          isActive ? '' : 'bg-slate-800 border-slate-700'
                        }`}
                        style={styles.track}
                      >
                        <div className={`w-6 h-6 rounded-full transition-transform shadow-md ${
                          isActive ? 'translate-x-6' : 'translate-x-0 bg-slate-500'
                        }`}
                        style={styles.thumb} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'prompts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-transparent rounded-3xl border border-slate-800 p-5">
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
                  className="w-full mt-5 bg-rose-600 border border-transparent disabled:bg-slate-800 disabled:border-slate-800 disabled:text-slate-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.2)] disabled:shadow-none"
                >
                  <Plus className="w-5 h-5" /> Add Prompt
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold mb-3 flex justify-between items-center px-1">
                  <span className="uppercase tracking-wider text-sm text-slate-300">Existing ({prompts.length})</span>
                  <button onClick={onResetPrompts} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold bg-rose-500/10 px-3 min-h-[44px] rounded-lg transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Defaults
                  </button>
                </h3>

                {/* Filters */}
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 hide-scrollbar">
                  <button onClick={() => { setPromptFilter('all'); setPromptPage(1); }} className={`min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${promptFilter === 'all' ? 'bg-rose-600 text-white border border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>All</button>
                  <button onClick={() => { setPromptFilter('tier1'); setPromptPage(1); }} className={`min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${promptFilter === 'tier1' ? 'bg-rose-600 text-white border border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>Level 1</button>
                  <button onClick={() => { setPromptFilter('tier2'); setPromptPage(1); }} className={`min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${promptFilter === 'tier2' ? 'bg-rose-600 text-white border border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>Level 2</button>
                  <button onClick={() => { setPromptFilter('tier3'); setPromptPage(1); }} className={`min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${promptFilter === 'tier3' ? 'bg-rose-600 text-white border border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>Level 3</button>
                  <button onClick={() => { setPromptFilter('tier4'); setPromptPage(1); }} className={`min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${promptFilter === 'tier4' ? 'bg-rose-600 text-white border border-transparent' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>Level 4</button>
                </div>

                <div className="space-y-2">
                  {(() => {
                    const filtered = prompts.filter(p => promptFilter === 'all' || p.tier === promptFilter);
                    const totalPages = Math.max(1, Math.ceil(filtered.length / PROMPTS_PER_PAGE));
                    const paginated = filtered.slice((promptPage - 1) * PROMPTS_PER_PAGE, promptPage * PROMPTS_PER_PAGE);

                    return (
                      <>
                        {paginated.map(prompt => {
                          const styles = getTierStyles(prompt.tier, true);
                          return (
                            <div key={prompt.id} className="group p-4 rounded-2xl flex items-start gap-3 border border-slate-800 hover:border-slate-700 transition-colors bg-transparent">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span 
                                    className="text-[10px] uppercase font-black px-2 py-0.5 rounded border"
                                    style={styles.container}
                                  >
                                    {prompt.tier.replace('tier', 'Lvl ')}
                                  </span>
                                  {prompt.isTimed && (
                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-800/50 border border-slate-700 px-2 py-0.5 rounded">
                                      {prompt.timeSeconds}s
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed" title={prompt.text}>{prompt.text}</p>
                              </div>
                              <button
                                onClick={() => onDeletePrompt(prompt.id)}
                                className="text-slate-600 hover:bg-red-500 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all shrink-0 opacity-50 group-hover:opacity-100"
                                aria-label="Delete prompt"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        
                        {/* Pagination UI */}
                        {filtered.length > PROMPTS_PER_PAGE && (
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50 mb-4 pb-4">
                            <button 
                              onClick={() => setPromptPage(p => Math.max(1, p - 1))}
                              disabled={promptPage === 1}
                              className="min-w-[44px] min-h-[44px] px-4 bg-slate-800 rounded-xl font-bold text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Prev
                            </button>
                            <span className="text-xs font-bold text-slate-500">
                              Page {promptPage} of {totalPages}
                            </span>
                            <button 
                              onClick={() => setPromptPage(p => Math.min(totalPages, p + 1))}
                              disabled={promptPage === totalPages}
                              className="min-w-[44px] min-h-[44px] px-4 bg-slate-800 rounded-xl font-bold text-sm text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'game' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">
              <div className="bg-red-950/30 border border-red-500/20 p-5 rounded-3xl text-center">
                <h3 className="text-red-400 font-bold mb-2 uppercase tracking-wider text-sm">Danger Zone</h3>
                <p className="text-slate-400 text-sm mb-6">This will reset all player scores and start a fresh tower.</p>
                {showResetConfirm ? (
                  <div className="space-y-3">
                    <p className="font-bold text-white text-sm">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onResetGame();
                          onClose();
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white min-h-[44px] rounded-xl font-bold transition-all active:scale-95"
                      >
                        Yes, Reset
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 min-h-[44px] rounded-xl font-bold transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50 min-h-[44px] rounded-xl font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" /> Reset Progress
                  </button>
                )}
              </div>

              {/* Ultimate Forfeits Section */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl mt-6">
                <h3 className="text-slate-300 font-bold mb-4 uppercase tracking-wider text-sm text-center">Ultimate Forfeits</h3>
                
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newForfeitText}
                    onChange={(e) => setNewForfeitText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddForfeit()}
                    placeholder="Enter a new forfeit..."
                    className="flex-1 bg-transparent border border-slate-700 rounded-xl px-4 min-h-[44px] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                  <button
                    onClick={handleAddForfeit}
                    disabled={!newForfeitText.trim()}
                    className="bg-rose-600 hover:bg-rose-500 border border-transparent disabled:bg-slate-800 disabled:border-slate-800 disabled:text-slate-600 text-white min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-[0_0_10px_rgba(225,29,72,0.2)] disabled:shadow-none"
                    aria-label="Add forfeit"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {forfeits.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No forfeits defined.</p>
                  ) : (
                    forfeits.map((forfeit, idx) => (
                      <div key={idx} className="group bg-transparent p-3 rounded-xl flex items-start justify-between gap-3 border border-slate-800 hover:border-slate-700 transition-colors">
                        <p className="text-sm text-slate-300 flex-1 pt-1 leading-relaxed">{forfeit}</p>
                        <button
                          onClick={() => onDeleteForfeit(forfeit)}
                          className="text-slate-600 hover:bg-red-500 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all shrink-0 opacity-50 group-hover:opacity-100"
                          aria-label="Delete forfeit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

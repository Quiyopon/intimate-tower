import { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Tower } from './components/Tower';
import { CardModal } from './components/CardModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { TowerIcon } from './components/TowerIcon';
import { useGameState } from './hooks/useGameState';
import { initAudio, setMuted, startHeartbeatLoop, stopHeartbeatLoop, startAmbientMusic, stopAmbientMusic, setAmbientDucked } from './utils/audio';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import type { Block, Tier } from './types';

import { AnimatePresence, motion } from 'framer-motion';

let isInputLocked = false;

function App() {
  const {
    gameState,
    updateGameState,
    resetGame,
    prompts,
    resetPrompts,
    addPrompt,
    deletePrompt,
    getRandomPrompt,
    forfeits,
    addForfeit,
    deleteForfeit,
  } = useGameState();

  const [showSettings, setShowSettings] = useState(false);
  const [isMutedState, setIsMutedState] = useState(false);
  const [showCollapseModal, setShowCollapseModal] = useState(false);
  const [forfeitText, setForfeitText] = useState('');
  const [showCustomForfeit, setShowCustomForfeit] = useState(false);
  const [customForfeitInput, setCustomForfeitInput] = useState('');
  const [lastInteractingPlayerId, setLastInteractingPlayerId] = useState<string | null>(null);

  const dareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync ambient music and heartbeat based on game state
  useEffect(() => {
    if (!isMutedState && !gameState.isCollapsed) {
      if (gameState.activePrompt) {
        setAmbientDucked(true);
        startHeartbeatLoop(true); // Heartbeat only during dare
      } else {
        stopHeartbeatLoop();
        setAmbientDucked(false);
        startAmbientMusic(); // Seductive ambient music during regular gameplay
      }
    } else {
      stopHeartbeatLoop();
      stopAmbientMusic();
    }
  }, [gameState.activePrompt, gameState.isCollapsed, isMutedState]);

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlockAudio = () => {
      initAudio();
      if (!isMutedState) {
        startAmbientMusic();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [isMutedState]);

  const toggleMute = () => {
    const newState = !isMutedState;
    setMuted(newState);
    setIsMutedState(newState);
    if (!newState) {
      initAudio();
      if (gameState.activePrompt) startHeartbeatLoop(true);
      else startAmbientMusic();
    }
  };

  const handlePullBlock = (block: Block) => {
    if (isInputLocked) return;
    isInputLocked = true;

    setLastInteractingPlayerId(gameState.players[gameState.currentPlayerIndex]?.id || null);

    // Mark block as removed
    const newBlocks = gameState.blocks.map((b: Block) => 
      b.id === block.id ? { ...b, isRemoved: true } : b
    );

    // The tower's instability meter is now managed dynamically via physics subscriptions in Tower.tsx
    // (InstabilityTracker component) to calculate real-time Center of Mass and tilt.

    // Check if tier is active
    if (!gameState.tierToggles[block.tier]) {
      updateGameState({
        blocks: newBlocks,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
      isInputLocked = false;
      return;
    }

    // Get prompt
    const prompt = getRandomPrompt(block.tier);
    if (!prompt) {
      updateGameState({
        blocks: newBlocks,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
      isInputLocked = false;
      return;
    }

    updateGameState({
      blocks: newBlocks,
    });

    if (dareTimeoutRef.current) clearTimeout(dareTimeoutRef.current);

    dareTimeoutRef.current = setTimeout(() => {
      updateGameState({ activePrompt: prompt });
    }, 3500);
  };

  const handleCompletePrompt = () => {
    if (!gameState.activePrompt) return;
    
    // Increase heartbeat level based on tier
    const tier = gameState.activePrompt.tier;
    const scoreIncrease = tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : tier === 'tier3' ? 3 : 5;
    
    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex].score = 
      (updatedPlayers[gameState.currentPlayerIndex].score || 0) + scoreIncrease;

    updateGameState({
      activePrompt: null,
      currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      players: updatedPlayers,
    });
    isInputLocked = false;
  };

  const handlePassPrompt = () => {
    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex].passes -= 1;
    
    updateGameState({
      activePrompt: null,
      currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      players: updatedPlayers,
    });
    isInputLocked = false;
  };

  const toggleTier = (tier: Tier) => {
    updateGameState({
      tierToggles: {
        ...gameState.tierToggles,
        [tier]: !gameState.tierToggles[tier]
      }
    });
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex] || { name: 'Player', passes: 0 };
  const blamePlayer = lastInteractingPlayerId 
    ? gameState.players.find(p => p.id === lastInteractingPlayerId) || currentPlayer
    : gameState.players[0] || currentPlayer;

  const rollForfeit = () => {
    if (forfeits.length === 0) {
      setForfeitText("Loser owes the winner a 10-minute massage right now.");
      return;
    }
    setForfeitText(forfeits[Math.floor(Math.random() * forfeits.length)]);
  };

  const handleResetGame = () => {
    setShowCollapseModal(false);
    setLastInteractingPlayerId(null);
    resetGame();
    isInputLocked = false;
  };

  const handleBackToSetup = () => {
    setShowCollapseModal(false);
    setLastInteractingPlayerId(null);
    resetGame();
    updateGameState({ gameStarted: false });
    isInputLocked = false;
  };

  const blocksPulled = gameState.blocks.filter(b => b.isRemoved).length;
  const roundsSurvived = Math.floor(blocksPulled / Math.max(1, gameState.players.length));

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
        <TitleScreen
          players={gameState.players}
          onUpdatePlayers={(players) => updateGameState({ players })}
          onStart={() => updateGameState({ gameStarted: true })}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMutedState}
          onToggleMute={toggleMute}
        />
        <AnimatePresence>
          {showSettings && (
            <SettingsModal
              onClose={() => setShowSettings(false)}
              tierToggles={gameState.tierToggles}
              onToggleTier={toggleTier}
              prompts={prompts}
              onAddPrompt={addPrompt}
              onDeletePrompt={deletePrompt}
              onResetPrompts={resetPrompts}
              onResetGame={resetGame}
              forfeits={forfeits}
              onAddForfeit={addForfeit}
              onDeleteForfeit={deleteForfeit}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#05050f] text-slate-100 flex flex-col font-sans overflow-hidden touch-none select-none">
      
      {/* 3D Canvas Background */}
      <div className={`absolute inset-0 z-0 ${gameState.isCollapsed && !showCollapseModal ? 'animate-[shake_0.1s_ease-in-out_infinite]' : ''}`}>
        <Tower 
          blocks={gameState.blocks} 
          onPullBlock={handlePullBlock}
          isCollapsed={gameState.isCollapsed}
          isDareActive={!!gameState.activePrompt}
          onCollapse={() => {
            if (gameState.isCollapsed) return;
            
            if (dareTimeoutRef.current) clearTimeout(dareTimeoutRef.current);

            if (navigator.vibrate) navigator.vibrate([500, 100, 500, 100, 800]);
            updateGameState({ isCollapsed: true, instability: 100, activePrompt: null });
            rollForfeit();
            setTimeout(() => {
              setShowCollapseModal(true);
            }, 1500);
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-safe z-10 relative bg-gradient-to-b from-[#0f0407] to-transparent pb-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center shadow-lg shadow-rose-900/20 text-rose-200">
            <TowerIcon className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white drop-shadow-md">Intimate Tower</h1>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={toggleMute}
            className="p-2.5 text-rose-300 hover:text-rose-100 bg-rose-950/60 backdrop-blur-md border border-rose-800/80 hover:bg-rose-900 hover:border-rose-700 rounded-full transition-colors shadow-lg shadow-rose-900/10"
          >
            {isMutedState ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-rose-300 hover:text-rose-100 bg-rose-950/60 backdrop-blur-md border border-rose-800/80 hover:bg-rose-900 hover:border-rose-700 rounded-full transition-colors shadow-lg shadow-rose-900/10"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Overlay UI */}
      <main className="flex-1 flex flex-col relative z-10 pointer-events-none">
        
        {/* Player Cards */}
        <div className="flex justify-center gap-3 mt-2 px-4 overflow-x-auto pb-6 pt-2 pointer-events-auto">
          {gameState.players.map((p, i) => {
            const isCurrent = i === gameState.currentPlayerIndex;
            return (
              <div 
                key={p.id}
                className={`flex flex-col items-center px-5 py-2.5 rounded-2xl border transition-all duration-300 ${
                  isCurrent 
                    ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(225,29,72,0.3)] scale-110 z-10' 
                    : 'border-white/10 bg-white/10 scale-95'
                }`}
              >
                <div className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                  {p.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Heart className={`w-4 h-4 ${p.score > 0 ? (isCurrent ? 'text-rose-500 fill-rose-500' : 'text-rose-500/60 fill-rose-500/60') : 'text-white/20'}`} />
                  <span className={`text-xs font-black ${isCurrent ? 'text-rose-200' : 'text-white/40'}`}>
                    {p.score > 0 ? `+${p.score}` : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Turn Banner */}
        <div className="w-full flex justify-center pointer-events-none z-10 mt-1 mb-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-rose-900/50 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(159,18,57,0.2)] animate-pulse">
            <span className="text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]">{currentPlayer.name}'s Turn</span>
            <span className="text-slate-300 ml-2">— Pull a block carefully</span>
          </div>
        </div>

        {/* Instability Indicator */}
        <div id="instability-container" className="absolute bottom-8 pb-6 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-between items-end mb-2 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tower Instability</span>
            <span id="instability-text" className="text-sm font-black text-slate-200">
              0%
            </span>
          </div>
          <div className="h-3 bg-slate-900/80 backdrop-blur-md rounded-full overflow-hidden border border-slate-700/50 p-0.5 shadow-lg">
            <div 
              id="instability-bar"
              className="h-full rounded-full bg-gradient-to-r transition-colors duration-200 from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              style={{ width: `0%` }}
            />
          </div>
        </div>
      </main>

      {/* Collapse Screen */}
      <AnimatePresence>
        {showCollapseModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-lg flex items-center justify-center p-6 text-center pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full flex flex-col items-center"
            >
              <h2 className="text-5xl sm:text-6xl font-black text-rose-400 mb-2 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(159,18,57,0.8)]">
                Collapse!
              </h2>
              <p className="text-lg mb-6 leading-relaxed text-slate-300">
                <strong className="text-white text-xl">{blamePlayer.name}</strong> caused the tower to fall.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 border border-slate-800 bg-slate-900/50 rounded-full px-5 py-2">
                <span>Rounds: <span className="text-white">{roundsSurvived}</span></span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Blocks: <span className="text-white">{blocksPulled}</span></span>
              </div>

              {/* Ultimate Forfeit Card */}
              <div className="w-full bg-gradient-to-br from-rose-950/60 to-slate-900/80 border border-rose-900/50 rounded-3xl p-6 mb-8 shadow-[0_0_30px_rgba(159,18,57,0.2)] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-rose-900 border-x border-b border-rose-800 text-rose-200 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-b-lg">
                  Ultimate Forfeit
                </div>
                
                <p className="text-xl font-bold text-rose-200 mt-4 mb-6 leading-snug">
                  {forfeitText}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rollForfeit}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm uppercase tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" /> Reroll
                  </button>
                  <button
                    onClick={() => {
                      setCustomForfeitInput('');
                      setShowCustomForfeit(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-200 border border-rose-800 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm uppercase tracking-wider"
                  >
                    Custom
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showCustomForfeit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-sm bg-slate-900 border border-rose-900/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
                    >
                      <h3 className="text-xl font-black text-rose-200 uppercase tracking-wider mb-2">Custom Forfeit</h3>
                      <input
                        type="text"
                        value={customForfeitInput}
                        onChange={(e) => setCustomForfeitInput(e.target.value)}
                        placeholder="Enter custom forfeit..."
                        className="w-full bg-slate-900/80 border border-rose-800/80 text-rose-100 px-4 py-3 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-rose-900/70 transition-all font-medium"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customForfeitInput.trim()) {
                            setForfeitText(customForfeitInput.trim());
                            setShowCustomForfeit(false);
                          }
                        }}
                      />
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => setShowCustomForfeit(false)}
                          className="flex-1 py-3 rounded-xl font-bold text-rose-200 bg-rose-950/30 border border-rose-800 hover:bg-rose-900 hover:border-rose-700 transition-colors uppercase tracking-wider text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (customForfeitInput.trim()) {
                              setForfeitText(customForfeitInput.trim());
                              setShowCustomForfeit(false);
                            }
                          }}
                          className="flex-1 py-3 rounded-xl font-bold text-white border border-transparent bg-rose-600 hover:bg-rose-500 transition-all uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                        >
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full flex flex-col gap-4">
                <button
                  onClick={handleResetGame}
                  className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-rose-500 to-rose-700 border border-rose-400 hover:from-rose-400 hover:to-rose-600 text-white px-8 py-5 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:shadow-[0_0_40px_rgba(225,29,72,0.6)] uppercase tracking-widest"
                >
                  <RefreshCw className="w-6 h-6" />
                  Play Again
                </button>
                
                <button
                  onClick={handleBackToSetup}
                  className="text-slate-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors py-2"
                >
                  Back to Setup / Change Players
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Modal */}
      <AnimatePresence>
        {gameState.activePrompt && !gameState.isCollapsed && (
          <div className="fixed inset-0 z-50 pointer-events-auto">
            <CardModal
              prompt={gameState.activePrompt}
              currentPlayer={currentPlayer.name}
              passesAvailable={currentPlayer.passes}
              onComplete={handleCompletePrompt}
              onPass={handlePassPrompt}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 pointer-events-auto">
            <SettingsModal
              onClose={() => setShowSettings(false)}
              tierToggles={gameState.tierToggles}
              onToggleTier={toggleTier}
              prompts={prompts}
              onAddPrompt={addPrompt}
              onDeletePrompt={deletePrompt}
              onResetPrompts={resetPrompts}
              onResetGame={resetGame}
              forfeits={forfeits}
              onAddForfeit={addForfeit}
              onDeleteForfeit={deleteForfeit}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Tower } from './components/Tower';
import { CardModal } from './components/CardModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { useGameState } from './hooks/useGameState';
import { initAudio, setMuted, startHeartbeatLoop, stopHeartbeatLoop, startAmbientMusic, stopAmbientMusic, setAmbientDucked } from './utils/audio';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import type { Block, Tier, Prompt } from './types';
import { calculatePhysics } from './utils/gameLogic';
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
  const [pendingPrompt, setPendingPrompt] = useState<Prompt | null>(null);
  const [isSettling, setIsSettling] = useState(false);

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

  // Handle settling delay before showing prompt
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSettling && pendingPrompt && !gameState.isCollapsed) {
      timer = setTimeout(() => {
        setIsSettling(false);
        updateGameState({ activePrompt: pendingPrompt });
        setPendingPrompt(null);
      }, 2000); // 2 second settle time
    }
    return () => clearTimeout(timer);
  }, [isSettling, pendingPrompt, gameState.isCollapsed]);

  // Cancel prompt if collapsed during settling
  useEffect(() => {
    if (gameState.isCollapsed && isSettling) {
      setIsSettling(false);
      setPendingPrompt(null);
    }
  }, [gameState.isCollapsed, isSettling]);

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

    // Set settling state
    setIsSettling(true);
    setPendingPrompt(prompt);
    updateGameState({
      blocks: newBlocks,
    });
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

  const rollForfeit = () => {
    if (forfeits.length === 0) {
      setForfeitText("Loser owes the winner a 10-minute massage right now.");
      return;
    }
    setForfeitText(forfeits[Math.floor(Math.random() * forfeits.length)]);
  };

  const handleResetGame = () => {
    setShowCollapseModal(false);
    resetGame();
    isInputLocked = false;
  };

  const handleBackToSetup = () => {
    setShowCollapseModal(false);
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
            if (navigator.vibrate) navigator.vibrate([500, 100, 500, 100, 800]);
            updateGameState({ isCollapsed: true, instability: 100 });
            rollForfeit();
            setTimeout(() => {
              setShowCollapseModal(true);
            }, 1500);
          }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-safe z-10 relative bg-gradient-to-b from-[#05050f] to-transparent pb-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">
            IT
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white drop-shadow-md">Intimate Tower</h1>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={toggleMute}
            className="p-2.5 text-rose-200 hover:text-white bg-slate-900/50 backdrop-blur-md border border-slate-700/50 hover:bg-slate-800 rounded-full transition-colors shadow-lg"
          >
            {isMutedState ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 text-rose-200 hover:text-white bg-slate-900/50 backdrop-blur-md border border-slate-700/50 hover:bg-slate-800 rounded-full transition-colors shadow-lg"
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
                    ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110 z-10' 
                    : 'border-white/10 bg-white/10 scale-95'
                }`}
              >
                <div className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                  {p.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Heart className={`w-4 h-4 ${p.score > 0 ? (isCurrent ? 'text-pink-500 fill-pink-500' : 'text-pink-500/60 fill-pink-500/60') : 'text-white/20'}`} />
                  <span className={`text-xs font-black ${isCurrent ? 'text-rose-200' : 'text-white/40'}`}>
                    {p.score > 0 ? `+${p.score}` : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Turn Banner */}
        <div className="absolute top-[80px] left-0 w-full flex justify-center pointer-events-none z-10">
          <div className="bg-slate-900/80 backdrop-blur-md border border-pink-500/30 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse">
            <span className="text-pink-400 font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">{currentPlayer.name}'s Turn</span>
            <span className="text-slate-300 ml-2">— Pull a block carefully</span>
          </div>
        </div>

        {/* Instability Indicator */}
        <div id="instability-container" className="absolute bottom-safe-8 bottom-8 left-1/2 -translate-x-1/2 w-72 text-center pointer-events-none z-10">
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
              <h2 className="text-5xl sm:text-6xl font-black text-red-500 mb-2 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                Collapse!
              </h2>
              <p className="text-lg mb-6 leading-relaxed text-slate-300">
                <strong className="text-white text-xl">{currentPlayer.name}</strong> caused the tower to fall.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 border border-slate-800 bg-slate-900/50 rounded-full px-5 py-2">
                <span>Rounds: <span className="text-white">{roundsSurvived}</span></span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Blocks: <span className="text-white">{blocksPulled}</span></span>
              </div>

              {/* Ultimate Forfeit Card */}
              <div className="w-full bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 rounded-3xl p-6 mb-8 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-b-lg">
                  Ultimate Forfeit
                </div>
                
                <p className="text-xl font-bold text-red-100 mt-4 mb-6 leading-snug">
                  {forfeitText}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={rollForfeit}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm uppercase tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" /> Reroll
                  </button>
                  <button
                    onClick={() => {
                      const custom = prompt("Enter a custom forfeit dare for the loser:");
                      if (custom) setForfeitText(custom);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700 py-3 rounded-xl font-bold transition-all active:scale-95 text-sm uppercase tracking-wider"
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div className="w-full flex flex-col gap-4">
                <button
                  onClick={handleResetGame}
                  className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white px-8 py-5 rounded-2xl font-black text-xl hover:brightness-110 transition-all active:scale-95 shadow-[0_0_30px_rgba(225,29,72,0.5)] uppercase tracking-widest"
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

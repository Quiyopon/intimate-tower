import { useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Tower } from './components/Tower';
import { CardModal } from './components/CardModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { useGameState } from './hooks/useGameState';
import { initAudio, setMuted, startHeartbeatLoop, stopHeartbeatLoop, startAmbientMusic, stopAmbientMusic, setAmbientDucked } from './utils/audio';
import { Volume2, VolumeX, Heart } from 'lucide-react';
import type { Block, Tier } from './types';
import { calculatePhysics } from './utils/gameLogic';
import { AnimatePresence, motion } from 'framer-motion';

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
  } = useGameState();

  const [showSettings, setShowSettings] = useState(false);
  const [isMutedState, setIsMutedState] = useState(false);

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
    // Mark block as removed
    const newBlocks = gameState.blocks.map((b: Block) => 
      b.id === block.id ? { ...b, isRemoved: true } : b
    );

    // Calculate new instability
    const { minMargin } = calculatePhysics(newBlocks);
    const instability = Math.max(0, Math.min(100, 100 - (minMargin / 1.5) * 100));

    // Check if tier is active
    if (!gameState.tierToggles[block.tier]) {
      updateGameState({
        blocks: newBlocks,
        instability,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
      return;
    }

    // Get prompt
    const prompt = getRandomPrompt(block.tier);
    if (!prompt) {
      updateGameState({
        blocks: newBlocks,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      });
      return;
    }

    // Show prompt modal
    updateGameState({
      blocks: newBlocks,
      instability,
      activePrompt: prompt,
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
  };

  const handlePassPrompt = () => {
    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex].passes -= 1;
    
    updateGameState({
      activePrompt: null,
      currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      players: updatedPlayers,
    });
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
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center font-bold shadow-lg">
            IT
          </div>
          <h1 className="font-bold text-xl tracking-tight">Intimate Tower</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleMute}
            className="p-2 text-rose-200 hover:text-rose-100 hover:bg-white/10 rounded-full transition-colors"
          >
            {isMutedState ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-rose-200 hover:text-rose-100 hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0">
        <div className="flex justify-center gap-4 mt-4 px-4 overflow-x-auto pb-2 z-10 relative">
          {gameState.players.map((p, i) => {
            const isCurrent = i === gameState.currentPlayerIndex;
            return (
              <div 
                key={p.id}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${
                  isCurrent 
                    ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                    : 'border-slate-800 bg-slate-900/50 opacity-50'
                }`}
              >
                <div className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {p.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Heart className={`w-4 h-4 ${p.score > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
                  <span className="text-xs font-black text-rose-200">
                    {p.score > 0 ? `+${p.score}` : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex items-end justify-center overflow-hidden">
          <Tower 
            blocks={gameState.blocks} 
            onPullBlock={handlePullBlock}
            isCollapsed={gameState.isCollapsed}
            isPaused={!!gameState.activePrompt}
            onCollapse={() => {
              if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
              updateGameState({ isCollapsed: true, instability: 100 });
            }}
          />
        </div>

        {/* Instability Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 text-center">
          <div className="text-xs text-slate-500 mb-1 font-bold uppercase tracking-wider">Tower Instability</div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all duration-500"
              style={{ width: `${gameState.instability}%` }}
            />
          </div>
        </div>
      </main>

      {/* Collapse Screen */}
      <AnimatePresence>
        {gameState.isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="max-w-sm"
            >
              <h2 className="text-5xl font-black text-red-500 mb-4 tracking-tighter uppercase drop-shadow-2xl">
                Collapse!
              </h2>
              <p className="text-xl mb-8 leading-relaxed">
                {currentPlayer.name} caused the tower to fall. The loser owes the ultimate forfeit!
              </p>
              <button
                onClick={resetGame}
                className="mx-auto flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-transform active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Modal */}
      <AnimatePresence>
        {gameState.activePrompt && !gameState.isCollapsed && (
          <CardModal
            prompt={gameState.activePrompt}
            currentPlayer={currentPlayer.name}
            passesAvailable={currentPlayer.passes}
            onComplete={handleCompletePrompt}
            onPass={handlePassPrompt}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

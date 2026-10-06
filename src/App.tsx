import { useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Tower } from './components/Tower';
import { CardModal } from './components/CardModal';
import { SettingsModal } from './components/SettingsModal';
import { useGameState } from './hooks/useGameState';
import { checkCollapse, calculateInstabilityIncrease } from './utils/gameLogic';
import type { Block, Tier } from './types';
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

  const handlePullBlock = (block: Block) => {
    // Determine if tower collapses
    const instabilityIncrease = calculateInstabilityIncrease(block.position);
    const newInstability = Math.min(100, gameState.instability + instabilityIncrease);
    const collapsed = checkCollapse(gameState.instability);

    // Update block as removed
    const newBlocks = gameState.blocks.map((b: Block) => 
      b.id === block.id ? { ...b, isRemoved: true } : b
    );

    if (collapsed) {
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
      updateGameState({
        blocks: newBlocks,
        instability: 100,
        isCollapsed: true,
      });
      return;
    }

    // Check if tier is active
    if (!gameState.tierToggles[block.tier]) {
      // Tier is disabled, just remove block and next turn
      updateGameState({
        blocks: newBlocks,
        instability: newInstability,
        currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      });
      return;
    }

    // Get prompt
    const prompt = getRandomPrompt(block.tier);
    if (!prompt) {
      // No prompts available for this tier
      updateGameState({
        blocks: newBlocks,
        instability: newInstability,
        currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
      });
      return;
    }

    // Show prompt modal
    updateGameState({
      blocks: newBlocks,
      instability: newInstability,
      activePrompt: prompt,
    });
  };

  const handleCompletePrompt = () => {
    updateGameState({
      activePrompt: null,
      currentPlayer: gameState.currentPlayer === 1 ? 2 : 1,
    });
  };

  const handlePassPrompt = () => {
    const isP1 = gameState.currentPlayer === 1;
    updateGameState({
      activePrompt: null,
      currentPlayer: isP1 ? 2 : 1,
      player1Passes: isP1 ? gameState.player1Passes - 1 : gameState.player1Passes,
      player2Passes: !isP1 ? gameState.player2Passes - 1 : gameState.player2Passes,
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

  const currentPlayerPasses = gameState.currentPlayer === 1 ? gameState.player1Passes : gameState.player2Passes;

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
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0">
        <div className="text-center mt-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-300">
            Player {gameState.currentPlayer}'s Turn
          </div>
        </div>

        <div className="flex-1 flex items-end justify-center pb-[10vh] overflow-hidden">
          <Tower 
            blocks={gameState.blocks} 
            onPullBlock={handlePullBlock}
            isCollapsed={gameState.isCollapsed}
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
                Player {gameState.currentPlayer} caused the tower to fall. The loser owes the ultimate forfeit!
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
            currentPlayer={gameState.currentPlayer}
            passesAvailable={currentPlayerPasses}
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

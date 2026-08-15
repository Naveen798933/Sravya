import React, { useState } from 'react';
import { gameLevels, type LevelConfig } from '../config/birthdayConfig';
import { BalloonPopGame } from './games/BalloonPopGame';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { TreatCatcherGame } from './games/TreatCatcherGame';
import { soundManager } from '../utils/soundManager';
import { ArrowRight, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameCanvasProps {
  currentLevelIndex: number;
  onLevelComplete: (levelId: number) => void;
  onAllLevelsComplete: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentLevelIndex,
  onLevelComplete,
  onAllLevelsComplete,
}) => {
  const [levelIndex, setLevelIndex] = useState(currentLevelIndex);
  const [levelUnlockedModal, setLevelUnlockedModal] = useState<LevelConfig | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  const currentLevel: LevelConfig = gameLevels[levelIndex] || gameLevels[0];

  const handleLevelFinished = () => {
    soundManager.playLevelClear();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff'],
    });
    setLevelUnlockedModal(currentLevel);
  };

  const handleNextLevel = () => {
    soundManager.playClick();
    setLevelUnlockedModal(null);

    const nextId = levelIndex + 1;
    if (nextId < gameLevels.length) {
      setLevelIndex(nextId);
      onLevelComplete(nextId);
    } else {
      onAllLevelsComplete();
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-70px)] w-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-pink-500/15 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center space-y-4">
        {/* Level Navigation / Tabs Header */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 sm:p-4 rounded-3xl border border-purple-500/30 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg shadow-glow">
              {levelIndex === 0 ? '🎈' : levelIndex === 1 ? '🃏' : '🧁'}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-900/80 text-pink-300 border border-purple-400/30">
                  Level {currentLevel.id} of 3
                </span>
                <span className="text-xs text-purple-300 font-semibold">{currentLevel.theme}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                {currentLevel.title}
              </h2>
            </div>
          </div>

          {/* Level Switcher Buttons */}
          <div className="flex items-center gap-1.5">
            {gameLevels.map((lvl, idx) => (
              <button
                key={lvl.id}
                onClick={() => {
                  soundManager.playClick();
                  setLevelIndex(idx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  levelIndex === idx
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-glow-pink scale-105 border border-pink-400/50'
                    : 'glass-card border border-purple-500/20 text-purple-300 hover:text-white'
                }`}
              >
                Level {lvl.id}
              </button>
            ))}
          </div>
        </div>

        {/* Objective and Score Banner */}
        <div className="w-full px-4 py-2.5 rounded-2xl glass-card border border-purple-400/20 text-xs sm:text-sm text-purple-200 flex flex-col sm:flex-row items-center justify-between gap-1 shadow-sm">
          <div>
            🎯 <strong className="text-pink-300">Objective:</strong> {currentLevel.objective}
          </div>
          {totalScore > 0 && (
            <div className="flex items-center gap-1 font-bold text-amber-300">
              <Trophy className="w-3.5 h-3.5" /> Total Score: {totalScore} pts
            </div>
          )}
        </div>

        {/* Game View Container */}
        <div className="w-full glass-card rounded-3xl border border-purple-500/30 shadow-2xl p-2 sm:p-4 relative overflow-hidden bg-purple-950/30">
          {levelIndex === 0 && (
            <BalloonPopGame
              key={`game-0`}
              onComplete={handleLevelFinished}
              onScoreUpdate={(s) => setTotalScore((prev) => prev + s)}
            />
          )}

          {levelIndex === 1 && (
            <MemoryMatchGame
              key={`game-1`}
              onComplete={handleLevelFinished}
              onScoreUpdate={(s) => setTotalScore((prev) => prev + s)}
            />
          )}

          {levelIndex === 2 && (
            <TreatCatcherGame
              key={`game-2`}
              onComplete={handleLevelFinished}
              onScoreUpdate={(s) => setTotalScore((prev) => prev + s)}
            />
          )}
        </div>
      </div>

      {/* ── Level Unlocked Modal ── */}
      {levelUnlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-md w-full glass-card p-6 sm:p-8 rounded-3xl border-2 border-purple-400/70 shadow-2xl shadow-purple-500/30 text-center space-y-6 animate-card-flip-in bg-purple-950/80">
            {/* Victory Badge Icon */}
            <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-1 flex items-center justify-center shadow-glow">
              <div className="w-full h-full rounded-full bg-purple-950 flex items-center justify-center text-3xl">
                🎉
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-extrabold px-3 py-1 rounded-full bg-amber-950/60 border border-amber-400/40">
                ✦ LEVEL COMPLETED ✦
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 text-glow-pink">
                {levelUnlockedModal.unlockedTitle}
              </h3>
              <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed pt-2">
                "{levelUnlockedModal.unlockedMessage}"
              </p>
            </div>

            <button
              onClick={handleNextLevel}
              className="btn-3d w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-base shadow-xl shadow-purple-500/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>
                {levelIndex < gameLevels.length - 1
                  ? `Proceed to Level ${levelIndex + 2} 🚀`
                  : 'Unlock Secret Memory & Cake! 🎁'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

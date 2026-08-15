import { useState, useRef, useCallback } from 'react';
import { birthdayConfig, birthdayMessages } from './config/birthdayConfig';
import { LandingPage } from './components/LandingPage';
import { IntroCinematic } from './components/IntroCinematic';
import { GameCanvas } from './components/GameCanvas';
import { PhotoRevealModal } from './components/PhotoRevealModal';
import { CakeScene } from './components/CakeScene';
import { FinalSurpriseModal } from './components/FinalSurpriseModal';
import { soundManager } from './utils/soundManager';
import { Volume2, VolumeX, Music, RotateCcw } from 'lucide-react';

type AppPhase = 'landing' | 'intro' | 'game' | 'photo' | 'cake' | 'final';

const TRANSITION_MS = 320;

export function App() {
  const [phase, setPhase]                   = useState<AppPhase>('landing');
  const [isExiting, setIsExiting]           = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [photoUnlocked, setPhotoUnlocked]   = useState(false);
  const [musicOn, setMusicOn]               = useState(soundManager.getMusicEnabled());
  const [soundOn, setSoundOn]               = useState(soundManager.getSoundEnabled());
  const pendingPhaseRef = useRef<AppPhase | null>(null);

  /** Smooth exit-then-enter transition between phases */
  const transitionTo = useCallback((next: AppPhase) => {
    if (isExiting) return;
    pendingPhaseRef.current = next;
    setIsExiting(true);
    setTimeout(() => {
      const target = pendingPhaseRef.current;
      if (target) setPhase(target);
      setIsExiting(false);
    }, TRANSITION_MS);
  }, [isExiting]);

  const handleLevelComplete = (levelId: number) => {
    if (levelId < 3) setCurrentLevelIndex(levelId);
  };

  const handleAllLevelsComplete = () => {
    setPhotoUnlocked(true);
    transitionTo('photo');
  };

  const handleRestartQuest = () => {
    setCurrentLevelIndex(0);
    setPhotoUnlocked(false);
    transitionTo('landing');
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-between bg-[#0d0714] text-purple-100 font-sans relative overflow-x-hidden"
      style={{ colorScheme: 'dark' }}
    >
      {/* ── Universal Sticky Header ── */}
      <header className="h-[70px] px-4 sm:px-8 border-b border-purple-500/20 glass-card flex items-center justify-between z-30 sticky top-0 backdrop-blur-xl">
        <div
          onClick={handleRestartQuest}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Restart Quest"
        >
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-base shadow-glow group-hover:scale-110 transition-transform duration-200"
            style={{ animation: 'glowPulse3d 3s ease-in-out infinite' }}
          >
            🎂
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">{birthdayConfig.name}</h2>
            <p className="text-[10px] text-pink-300 font-medium">
              Birthday Quest • {birthdayConfig.dobFormatted}
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => { const e = soundManager.toggleMusic(); setMusicOn(e); }}
            className={`p-2 rounded-xl transition-all glass-card border text-xs flex items-center gap-1.5 cursor-pointer ${
              musicOn ? 'border-purple-400 text-purple-300 shadow-glow' : 'border-slate-800 text-slate-500'
            }`}
            title="Toggle Music"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">{musicOn ? 'Music ON' : 'Music OFF'}</span>
          </button>

          <button
            onClick={() => { const e = soundManager.toggleSound(); setSoundOn(e); }}
            className={`p-2 rounded-xl transition-all glass-card border text-xs flex items-center gap-1.5 cursor-pointer ${
              soundOn ? 'border-purple-400 text-purple-300 shadow-glow' : 'border-slate-800 text-slate-500'
            }`}
            title="Toggle Sound Effects"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-medium">{soundOn ? 'SFX ON' : 'SFX OFF'}</span>
          </button>

          {/* Quick Scene Selector for testing and navigation */}
          <select
            value={phase}
            onChange={(e) => {
              const target = e.target.value as AppPhase;
              if (target === 'photo') setPhotoUnlocked(true);
              transitionTo(target);
            }}
            className="p-1.5 sm:p-2 rounded-xl glass-card border border-purple-500/30 text-purple-200 text-xs bg-purple-950/80 focus:outline-none focus:border-purple-400 transition-colors cursor-pointer hidden md:block"
            title="Jump to Scene"
          >
            <option value="landing" className="bg-[#120824]">🌟 Home</option>
            <option value="intro" className="bg-[#120824]">🎬 Intro</option>
            <option value="game" className="bg-[#120824]">🎮 Quest Game</option>
            <option value="photo" className="bg-[#120824]">📸 Photo Reveal</option>
            <option value="cake" className="bg-[#120824]">🎂 Cake & Candles</option>
            <option value="final" className="bg-[#120824]">🎉 Grand Surprise</option>
          </select>

          {phase !== 'landing' && (
            <button
              onClick={handleRestartQuest}
              className="p-2 rounded-xl glass-card border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Reset Quest"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Restart</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Phase Router with enter/exit transitions ── */}
      <main
        className="flex-1 w-full flex items-center justify-center relative"
        style={{
          animation: isExiting
            ? `phaseExit ${TRANSITION_MS}ms ease-in forwards`
            : `phaseEnter ${TRANSITION_MS + 50}ms cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        {phase === 'landing' && <LandingPage onStart={() => transitionTo('intro')} />}
        {phase === 'intro'   && <IntroCinematic onStartGame={() => transitionTo('game')} />}
        {phase === 'game'    && (
          <GameCanvas
            currentLevelIndex={currentLevelIndex}
            onLevelComplete={handleLevelComplete}
            onAllLevelsComplete={handleAllLevelsComplete}
          />
        )}
        {phase === 'photo' && (
          <PhotoRevealModal
            unlocked={photoUnlocked}
            onProceedToCake={() => transitionTo('cake')}
          />
        )}
        {phase === 'cake'  && <CakeScene onProceedToFinal={() => transitionTo('final')} />}
        {phase === 'final' && <FinalSurpriseModal onRestartQuest={handleRestartQuest} />}
      </main>

      {/* ── Minimal Aesthetic Footer ── */}
      <footer className="py-3 px-4 border-t border-purple-500/10 text-center text-xs text-purple-300/80 z-20 backdrop-blur-md bg-purple-950/20">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
          <span>{birthdayMessages.footerText}</span>
          <span className="hidden sm:inline text-purple-600">•</span>
          <span className="flex items-center gap-1">
            Developed by{' '}
            <a
              href={birthdayConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 underline underline-offset-2 flex items-center gap-1 font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              {birthdayConfig.developer}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

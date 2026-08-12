import React, { useState, useEffect } from 'react';
import { birthdayConfig, birthdayMessages } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { Lock, Sparkles, Heart, Cake } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PhotoRevealModalProps {
  unlocked: boolean;
  onProceedToCake: () => void;
}

export const PhotoRevealModal: React.FC<PhotoRevealModalProps> = ({ unlocked, onProceedToCake }) => {
  const [revealed, setRevealed]       = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError]   = useState(false);
  // 'locked' → 'flipping' → 'unlocked'
  const [flipState, setFlipState] = useState<'locked' | 'flipping' | 'unlocked'>('locked');

  useEffect(() => {
    if (!unlocked) return;
    soundManager.playLevelClear();

    // Step 1: show locked state briefly
    const t1 = setTimeout(() => {
      setFlipState('flipping');

      // Step 2: mid-flip, swap content
      const t2 = setTimeout(() => {
        setRevealed(true);
        setFlipState('unlocked');
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.45 },
          colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff'],
        });
        setTimeout(() => confetti({
          particleCount: 80, spread: 80, origin: { y: 0.5, x: 0.1 },
          colors: ['#a855f7', '#ec4899'],
        }), 300);
        setTimeout(() => confetti({
          particleCount: 80, spread: 80, origin: { y: 0.5, x: 0.9 },
          colors: ['#fbbf24', '#ffffff'],
        }), 500);
      }, 350);

      return () => clearTimeout(t2);
    }, 700);

    return () => clearTimeout(t1);
  }, [unlocked]);

  if (!unlocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Background glowing particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[90px]"
          style={{ animation: 'float3dLayer2 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[200px] h-[200px] bg-amber-400/10 rounded-full blur-[70px]"
          style={{ animation: 'float3dLayer1 6s ease-in-out infinite 1s' }} />
      </div>

      <div
        className="relative max-w-lg w-full z-10 my-auto"
        style={{
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* 3D Flip Container */}
        <div
          style={{
            animation: flipState === 'flipping'  ? 'cardFlipOut 0.35s ease-in forwards' :
                       flipState === 'unlocked'  ? 'cardFlipIn  0.5s cubic-bezier(0.16,1,0.3,1) forwards' :
                       'none',
          }}
        >
          {!revealed ? (
            /* ── Locked State ── */
            <div className="glass-card p-8 rounded-3xl border border-purple-500/40 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-900 to-purple-800 border-2 border-purple-400/40 flex items-center justify-center">
                <Lock className="w-12 h-12 text-purple-300 animate-bounce" />
              </div>
              {/* Skeleton shimmer bars */}
              <div className="space-y-3">
                <div className="h-4 w-3/4 mx-auto rounded-full shimmer-skeleton" />
                <div className="h-3 w-1/2 mx-auto rounded-full shimmer-skeleton" />
              </div>
              <div className="h-48 rounded-2xl shimmer-skeleton" />
              <div className="h-3 w-2/3 mx-auto rounded-full shimmer-skeleton" />
              <div>
                <h3 className="text-2xl font-bold text-white">🔒 Unlocking Special Memory...</h3>
                <p className="text-sm text-purple-300 mt-2">Preparing your personal birthday photo reveal!</p>
              </div>
            </div>
          ) : (
            /* ── Unlocked Photo Reveal ── */
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-purple-400/60 shadow-2xl shadow-purple-500/40 text-center space-y-6">
              <div className="flex items-center justify-between animate-stagger-1">
                <span className="text-xs uppercase tracking-widest text-pink-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> SECRET MEMORY UNLOCKED
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30">
                  {birthdayConfig.dobFormatted}
                </span>
              </div>

              {/* Photo */}
              <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-purple-400/40 bg-purple-950/80 group animate-stagger-2"
                style={{ boxShadow: '0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(236,72,153,0.15)' }}>
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 shimmer-skeleton rounded-2xl" />
                )}

                {imageError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white space-y-4">
                    <Heart className="w-20 h-20 text-pink-400 animate-heartbeat" style={{ filter: 'drop-shadow(0 0 20px #ec4899)' }} />
                    <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                      {birthdayConfig.name}
                    </h4>
                    <p className="text-xs text-purple-200 max-w-xs">{birthdayMessages.photoCaption}</p>
                  </div>
                ) : (
                  <img
                    src={birthdayConfig.photoUrl}
                    alt={`Special memory photo of ${birthdayConfig.name}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover rounded-2xl transform group-hover:scale-105 transition-transform duration-700"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-sm font-semibold text-pink-200 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                    {birthdayConfig.name}
                  </p>
                  <p className="text-xs text-purple-300 mt-0.5">"{birthdayMessages.photoCaption}"</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => { soundManager.playClick(); onProceedToCake(); }}
                className="btn-3d w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-lg shadow-xl shadow-purple-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 group overflow-hidden relative animate-stagger-3"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700" />
                <Cake className="w-6 h-6 animate-bounce relative z-10" />
                <span className="relative z-10">Let's Cut Sravya's Birthday Cake! 🎂</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

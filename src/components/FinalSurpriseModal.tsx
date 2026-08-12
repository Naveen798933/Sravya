import React, { useEffect } from 'react';
import { birthdayConfig, birthdayMessages } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { FireworksCanvas } from './FireworksCanvas';
import { Heart, Sparkles, RefreshCw, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalSurpriseModalProps {
  onRestartQuest: () => void;
}

export const FinalSurpriseModal: React.FC<FinalSurpriseModalProps> = ({ onRestartQuest }) => {
  useEffect(() => {
    soundManager.playLevelClear();

    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#ec4899', '#fbbf24'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#fbbf24'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <FireworksCanvas active={true} intensity="high" />

      <div className="relative max-w-xl w-full z-10 text-center space-y-8 my-auto">

        {/* Giant 3D Glowing Heart with Orbit Rings */}
        <div className="relative flex justify-center animate-stagger-1">
          {/* Orbit rings around the heart */}
          <div
            className="absolute"
            style={{
              width: '180px', height: '180px',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Ring 1 */}
            <div
              style={{
                position: 'absolute', inset: 0,
                border: '2px solid rgba(168,85,247,0.5)',
                borderRadius: '50%',
                animation: 'ringRotate 5s linear infinite',
                transformStyle: 'preserve-3d',
              }}
            >
              <div style={{
                position: 'absolute', top: '-7px', left: '50%',
                transform: 'translateX(-50%)',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#a855f7',
                boxShadow: '0 0 16px #a855f7, 0 0 32px rgba(168,85,247,0.5)',
              }} />
              <div style={{
                position: 'absolute', bottom: '-7px', left: '50%',
                transform: 'translateX(-50%)',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#c084fc',
                boxShadow: '0 0 10px #c084fc',
              }} />
            </div>

            {/* Ring 2 — reverse, wider */}
            <div
              style={{
                position: 'absolute', inset: '-20px',
                border: '1.5px solid rgba(236,72,153,0.4)',
                borderRadius: '50%',
                animation: 'ringRotateReverse 8s linear infinite',
                transformStyle: 'preserve-3d',
              }}
            >
              <div style={{
                position: 'absolute', top: '-5px', left: '50%',
                transform: 'translateX(-50%)',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#ec4899',
                boxShadow: '0 0 12px #ec4899',
              }} />
              <div style={{
                position: 'absolute', right: '-5px', top: '50%',
                transform: 'translateY(-50%)',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#f9a8d4',
                boxShadow: '0 0 8px #f9a8d4',
              }} />
            </div>

            {/* Ring 3 — amber, different tilt */}
            <div
              style={{
                position: 'absolute', inset: '-40px',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '50%',
                animation: 'ringRotate 12s linear infinite',
                transformStyle: 'preserve-3d',
              }}
            >
              <div style={{
                position: 'absolute', top: '-4px', left: '50%',
                transform: 'translateX(-50%)',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 12px #f59e0b',
              }} />
            </div>
          </div>

          {/* Central heart orb */}
          <div
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 flex items-center justify-center animate-glow-3d"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777, #f59e0b)',
              boxShadow: '0 0 50px rgba(168,85,247,0.6), 0 0 100px rgba(236,72,153,0.3)',
            }}
          >
            <div className="w-full h-full rounded-full bg-purple-950/80 flex items-center justify-center backdrop-blur-md">
              <Heart
                className="w-16 h-16 sm:w-20 sm:h-20 text-pink-400 fill-pink-400"
                style={{
                  animation: 'heartbeat 1.5s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 20px #ec4899)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content with staggered entrance */}
        <div className="space-y-6">
          {/* Victory badge */}
          <div className="flex items-center justify-center gap-3 animate-stagger-2">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300 animate-star-pop" />
            <span className="text-xs uppercase tracking-widest text-pink-300 font-bold">
              QUEST COMPLETED — VICTORY!
            </span>
            <Star className="w-5 h-5 text-amber-300 fill-amber-300 animate-star-pop" style={{ animationDelay: '0.15s' }} />
          </div>

          {/* Main title */}
          <h1
            className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-amber-200 tracking-tight animate-stagger-3 text-glow-pink"
            style={{ lineHeight: 1.1 }}
          >
            {birthdayMessages.finalTitle}
          </h1>

          <p className="text-xs font-semibold text-purple-300 animate-stagger-3">
            {birthdayConfig.dobFormatted}
          </p>

          {/* Message card */}
          <div
            className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-400/50 shadow-2xl space-y-4 text-purple-100 text-sm sm:text-base leading-relaxed text-left bg-purple-950/40 animate-stagger-4"
            style={{ boxShadow: '0 0 40px rgba(168,85,247,0.2), 0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center gap-2 text-pink-300 font-bold border-b border-purple-500/30 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" style={{ animation: 'starSpin 3s linear infinite' }} />
              <span>A Personal Note for Gudapati Sravya</span>
            </div>
            <p>{birthdayMessages.finalMessage}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 animate-stagger-5">
          <button
            onClick={() => { soundManager.playClick(); onRestartQuest(); }}
            className="btn-3d w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-base shadow-xl shadow-purple-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 overflow-hidden relative group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700" />
            <RefreshCw className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Replay Birthday Quest 🎮</span>
          </button>

          <div className="text-center space-y-1 text-xs text-purple-300">
            <p>{birthdayMessages.footerText}</p>
            <p className="flex items-center justify-center gap-1.5 font-medium">
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
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

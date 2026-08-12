import React, { useState, useEffect, useRef } from 'react';
import { birthdayMessages } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { Sparkles, Play, Heart, Scroll } from 'lucide-react';

interface IntroCinematicProps {
  onStartGame: () => void;
}

export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onStartGame }) => {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = birthdayMessages.introStory;
  const [isDone, setIsDone]     = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skipToEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(fullText);
    setIsDone(true);
  };

  useEffect(() => {
    let index = 0;
    intervalRef.current = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsDone(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullText]);

  const handleStart = () => {
    if (hasClicked) return;
    setHasClicked(true);
    soundManager.playClick();
    setTimeout(onStartGame, 300);
  };

  return (
    <div className="relative min-h-[calc(100dvh-70px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* 3D Layered Background Orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ perspective: '800px', perspectiveOrigin: '50% 50%' }}
      >
        {/* Deep background orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-[130px]"
          style={{ animation: 'float3dLayer3 10s ease-in-out infinite' }}
        />
        {/* Mid orb */}
        <div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-pink-600/15 rounded-full blur-[90px]"
          style={{ animation: 'float3dLayer2 8s ease-in-out infinite 1s' }}
        />
        {/* Front orb */}
        <div
          className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-[70px]"
          style={{ animation: 'float3dLayer1 6s ease-in-out infinite 0.5s' }}
        />

        {/* 3D orbit rings */}
        <div className="orbit-container">
          <div
            style={{
              width: '340px', height: '340px',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '50%',
              animation: 'ringRotate 12s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            <div style={{
              position: 'absolute', top: '-5px', left: '50%',
              transform: 'translateX(-50%)',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#a855f7', boxShadow: '0 0 12px #a855f7',
            }} />
          </div>
        </div>
        <div className="orbit-container">
          <div
            style={{
              width: '460px', height: '460px',
              border: '1px solid rgba(236,72,153,0.15)',
              borderRadius: '50%',
              animation: 'ringRotateReverse 18s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            <div style={{
              position: 'absolute', top: '-4px', left: '50%',
              transform: 'translateX(-50%)',
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#ec4899', boxShadow: '0 0 10px #ec4899',
            }} />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-6 animate-phase-enter">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-purple-500/40 text-xs font-bold text-pink-300 animate-stagger-1">
          <Scroll className="w-4 h-4 text-amber-300" />
          <span>MISSION BRIEFING</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-amber-200 leading-tight animate-stagger-2 text-glow-purple">
          {birthdayMessages.introTitle}
        </h1>

        {/* Typewriter Card — click anywhere to skip */}
        <div
          className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-400/50 shadow-2xl text-left space-y-4 relative bg-purple-950/40 cursor-pointer animate-stagger-3 card-3d"
          onClick={!isDone ? skipToEnd : undefined}
          title={!isDone ? 'Click to skip intro...' : undefined}
          style={{ transition: 'transform 0.2s ease-out' }}
        >
          <div className="flex items-center gap-2 text-pink-300 font-semibold border-b border-purple-500/30 pb-3 text-sm">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-heartbeat" />
            <span>For GUDAPATI SRAVYA — from a secret friend</span>
          </div>

          <div className="min-h-[100px] sm:min-h-[120px]">
            <p className="text-sm sm:text-base text-purple-100 leading-relaxed font-mono">
              {displayedText}
              {!isDone && (
                <span style={{ animation: 'typewriterCursor 0.7s step-end infinite' }} className="text-pink-400">
                  ▌
                </span>
              )}
            </p>
          </div>

          {isDone && (
            <div className="flex items-center gap-1.5 text-xs text-purple-400 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Mission briefing complete. Ready to begin your quest!</span>
            </div>
          )}

          {!isDone && (
            <p className="text-xs text-purple-500/70 text-right">Click card to skip →</p>
          )}
        </div>

        {/* CTA Start Button */}
        <button
          id="begin-quest-btn"
          onClick={handleStart}
          disabled={hasClicked}
          aria-label="Begin Level 1 of the Birthday Quest"
          className="btn-3d group w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-lg shadow-xl shadow-purple-900/50 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait animate-stagger-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-700" />
          <span className="relative z-10">{hasClicked ? 'Loading Level 1...' : 'Begin Quest — Level 1 🎮'}</span>
          <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
        </button>
      </div>
    </div>
  );
};

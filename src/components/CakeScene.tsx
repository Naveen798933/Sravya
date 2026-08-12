import React, { useState, useEffect, useRef } from 'react';
import { birthdayMessages } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { FireworksCanvas } from './FireworksCanvas';
import { Mic, MicOff, Flame, Sparkles, Heart, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CakeSceneProps {
  onProceedToFinal: () => void;
}

interface Candle {
  id: number;
  lit: boolean;
}

export const CakeScene: React.FC<CakeSceneProps> = ({ onProceedToFinal }) => {
  const CANDLE_COUNT = 18;
  const [candles, setCandles] = useState<Candle[]>(
    Array.from({ length: CANDLE_COUNT }, (_, i) => ({ id: i, lit: true }))
  );
  const [micActive, setMicActive]   = useState(false);
  const [micError, setMicError]     = useState<string | null>(null);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [allExtinguished, setAllExtinguished] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Check if all extinguished
  useEffect(() => {
    const activeCandles = candles.filter((c) => c.lit);
    if (activeCandles.length === 0 && !allExtinguished) {
      setAllExtinguished(true);
      setTimeout(() => {
        setFireworksActive(true);
        setShowCelebration(true);
        soundManager.playLevelClear();
        confetti({ particleCount: 180, spread: 120, origin: { y: 0.45 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5, x: 0.2 } }), 400);
        setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5, x: 0.8 } }), 700);
      }, 300);
    }
  }, [candles, allExtinguished]);

  const extinguishCandle = (id: number) => {
    setCandles((prev) => prev.map((c) => (c.id === id ? { ...c, lit: false } : c)));
    soundManager.playCandleBlow();
  };

  const blowAllCandles = () => {
    setCandles((prev) => prev.map((c) => ({ ...c, lit: false })));
    soundManager.playCandleBlow();
  };

  const extinguishRandomCandle = () => {
    setCandles((prev) => {
      const lit = prev.filter((c) => c.lit);
      if (lit.length === 0) return prev;
      const target = lit[Math.floor(Math.random() * lit.length)];
      soundManager.playCandleBlow();
      return prev.map((c) => (c.id === target.id ? { ...c, lit: false } : c));
    });
  };

  const toggleMicrophone = async () => {
    if (micActive) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      await audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setMicActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray    = new Uint8Array(bufferLength);

      setMicActive(true);
      setMicError(null);

      const checkBlow = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        if (avg > 45) extinguishRandomCandle();
        requestAnimationFrame(checkBlow);
      };
      checkBlow();
    } catch {
      setMicError('Mic unavailable. Tap candles or use Blow All button!');
      setMicActive(false);
    }
  };

  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const remainingCount = candles.filter((c) => c.lit).length;

  return (
    <div className="relative min-h-[calc(100dvh-70px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      <FireworksCanvas active={fireworksActive} intensity="high" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6">
        {/* Title */}
        <div className="space-y-2 animate-phase-enter">
          <span className="text-xs uppercase tracking-widest text-pink-400 font-bold px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/30">
            {birthdayMessages.cakeSub}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-amber-200 mt-2 text-glow-pink">
            {birthdayMessages.cakeTitle}
          </h1>
          <p className="text-xs sm:text-sm text-purple-300">
            {remainingCount > 0
              ? `Tap candles or click below to extinguish them! (${remainingCount} lit 🕯️)`
              : '🎉 All candles extinguished! Grand fireworks launched!'}
          </p>
        </div>

        {/* 3D Cake Scene */}
        <div className="cake-scene relative py-4 flex flex-col items-center justify-center animate-stagger-2">

          {/* Candles — arranged above the 3D cake */}
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 mb-[-10px] z-20 px-2 flex-wrap max-w-[280px] sm:max-w-sm relative">
            {candles.map((candle) => (
              <button
                key={candle.id}
                onClick={() => extinguishCandle(candle.id)}
                className="relative flex flex-col items-center focus:outline-none group cursor-pointer"
                title="Tap to blow out!"
                style={{ transform: 'perspective(200px) rotateX(5deg)' }}
              >
                {/* Flame or Smoke */}
                {candle.lit ? (
                  <div className="relative w-3.5 h-6 mb-0.5 flex flex-col items-center">
                    {/* Outer glow */}
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm animate-pulse" />
                    {/* Main flame */}
                    <div
                      className="w-3 h-5 rounded-full bg-gradient-to-t from-amber-600 via-yellow-300 to-white group-hover:scale-125 transition-transform z-10 relative"
                      style={{ animation: 'flameDance 0.35s ease-in-out infinite' }}
                    />
                    {/* Inner blue core */}
                    <div className="absolute bottom-1 w-1.5 h-2 rounded-full bg-blue-200/80 z-20" />
                  </div>
                ) : (
                  <div className="w-2 h-5 mb-0.5 flex justify-center items-start">
                    <div className="w-1 h-3 bg-slate-400/50 rounded-full animate-rise-smoke opacity-60" />
                  </div>
                )}

                {/* Candle body */}
                <div
                  className="w-2 h-10 sm:h-12 rounded-t-sm border border-purple-300/30 shadow-md"
                  style={{
                    background: `linear-gradient(to bottom, ${
                      candle.lit
                        ? 'hsl(' + (candle.id * 19) + ', 80%, 75%)'
                        : 'hsl(' + (candle.id * 19) + ', 30%, 50%)'
                    }, hsl(${240 + candle.id * 8}, 60%, 40%))`,
                    transform: 'perspective(100px) rotateX(8deg)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* 3D Birthday Cake */}
          <div className="cake-3d-group flex flex-col items-center z-10">
            {/* Top Tier */}
            <div className="cake-tier w-36 sm:w-44">
              {/* Frosting top */}
              <div
                className="w-full h-3 relative overflow-hidden"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(236,72,153,0.5))' }}
              >
                {/* Frosting drips */}
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-4 rounded-b-full bg-pink-100"
                    style={{ left: `${i * 14}%`, height: `${8 + (i % 3) * 4}px` }}
                  />
                ))}
              </div>
              <div
                className="w-full h-14 rounded-t-xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #a855f7 100%)',
                  transform: 'perspective(300px) rotateX(10deg)',
                  boxShadow: '0 8px 20px rgba(147,51,234,0.5), inset 0 2px 0 rgba(255,255,255,0.3)',
                }}
              >
                <div className="absolute top-0 w-full h-3 bg-white/30 rounded-b-xl" />
                <span className="text-xs font-bold text-white tracking-wider drop-shadow-md">SRAVYA • 2006</span>
              </div>
            </div>

            {/* Middle Tier */}
            <div className="cake-tier w-48 sm:w-60">
              <div
                className="w-full h-4 relative overflow-hidden"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(168,85,247,0.4))' }}
              >
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-4 rounded-b-full bg-purple-200"
                    style={{ left: `${i * 10}%`, height: `${6 + (i % 4) * 3}px` }}
                  />
                ))}
              </div>
              <div
                className="w-full h-[68px] flex items-center justify-around px-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7e22ce 0%, #be185d 50%, #6d28d9 100%)',
                  transform: 'perspective(300px) rotateX(10deg)',
                  boxShadow: '0 10px 28px rgba(126,34,206,0.6), inset 0 2px 0 rgba(255,255,255,0.2)',
                }}
              >
                <div className="absolute top-0 w-full h-4 bg-purple-300/30 rounded-b-2xl" />
                <Heart className="w-5 h-5 text-pink-300 fill-pink-300 animate-heartbeat" />
                <Sparkles className="w-5 h-5 text-amber-300" style={{ animation: 'starSpin 3s linear infinite' }} />
                <span className="text-white font-bold text-sm">🎂</span>
                <Sparkles className="w-5 h-5 text-amber-300" style={{ animation: 'starSpin 3s linear infinite reverse' }} />
                <Heart className="w-5 h-5 text-pink-300 fill-pink-300 animate-heartbeat" />
              </div>
            </div>

            {/* Bottom Base Tier */}
            <div className="cake-tier w-64 sm:w-80">
              <div
                className="w-full h-4 relative overflow-hidden"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(99,102,241,0.5))' }}
              >
                {[...Array(13)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 rounded-b-full bg-indigo-200"
                    style={{ left: `${i * 7.7}%`, width: '14px', height: `${5 + (i % 3) * 4}px` }}
                  />
                ))}
              </div>
              <div
                className="w-full h-[80px] rounded-b-3xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e1b4b 100%)',
                  transform: 'perspective(300px) rotateX(10deg)',
                  boxShadow: '0 16px 40px rgba(30,27,75,0.8), inset 0 2px 0 rgba(167,139,250,0.3)',
                }}
              >
                <div className="absolute top-0 w-full h-5 bg-indigo-400/20 rounded-b-3xl" />
                <span className="text-sm tracking-widest text-purple-200 font-semibold drop-shadow-md">
                  ✨ 14 • 08 • 2006 ✨
                </span>
              </div>
            </div>

            {/* Plate */}
            <div
              className="w-72 sm:w-96 h-5 rounded-full mt-1 backdrop-blur-md shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom, rgba(200,200,220,0.5), rgba(140,140,180,0.3))',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 30px rgba(168,85,247,0.2)',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 animate-stagger-3">
          <button
            onClick={blowAllCandles}
            disabled={remainingCount === 0}
            className="btn-3d px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Flame className="w-4 h-4 text-yellow-300" />
            <span>Blow All Candles 💨</span>
          </button>

          <button
            onClick={toggleMicrophone}
            className={`btn-3d px-5 py-3 rounded-2xl text-xs font-semibold glass-card border transition-all flex items-center gap-2 ${
              micActive
                ? 'border-green-400 text-green-300 shadow-lg shadow-green-500/20 bg-green-950/40'
                : 'border-purple-500/30 text-purple-200 hover:bg-purple-500/20'
            }`}
          >
            {micActive
              ? <Mic className="w-4 h-4 text-green-400 animate-pulse" />
              : <MicOff className="w-4 h-4 text-purple-400" />}
            <span>{micActive ? 'Mic Active (Blow into mic!)' : 'Enable Mic Blow Detection'}</span>
          </button>
        </div>

        {micError && <p className="text-xs text-amber-300 animate-fade-in">{micError}</p>}

        {/* Celebration Overlay + Final Button */}
        {showCelebration && (
          <div className="pt-4 animate-card-flip-in">
            <div className="glass-card p-6 rounded-3xl border border-amber-400/40 shadow-2xl shadow-amber-500/20 space-y-4 bg-amber-950/20">
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-3 text-4xl animate-bounce">
                  🎉 🎂 🎉
                </div>
                <p className="text-amber-200 font-bold text-lg text-glow-amber">
                  🎊 All Candles Blown! Make a Wish, Sravya!
                </p>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onProceedToFinal();
                }}
                className="btn-3d w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-lg shadow-2xl shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Gift className="w-6 h-6 animate-bounce text-yellow-200" />
                <span>🎁 Open Your Final Surprise!</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

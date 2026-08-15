import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from '../../utils/soundManager';
import { Sparkles, Trophy, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TreatCatcherGameProps {
  onComplete: () => void;
  onScoreUpdate: (score: number) => void;
}

interface FallingTreat {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  emoji: string;
  points: number;
  isHazard: boolean;
  caught: boolean;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

const TREAT_TYPES = [
  { emoji: '🎂', points: 300, isHazard: false, size: 28 },
  { emoji: '🎁', points: 400, isHazard: false, size: 28 },
  { emoji: '🧁', points: 200, isHazard: false, size: 26 },
  { emoji: '🍓', points: 150, isHazard: false, size: 24 },
  { emoji: '💖', points: 150, isHazard: false, size: 26 },
  { emoji: '⭐', points: 250, isHazard: false, size: 26 },
];

const TARGET_CATCH_COUNT = 10;

export const TreatCatcherGame: React.FC<TreatCatcherGameProps> = ({ onComplete, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [caughtCount, setCaughtCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const basketRef = useRef({
    x: 200,
    width: 90,
    height: 22,
    speed: 7,
  });

  const treatsRef = useRef<FallingTreat[]>([]);
  const particlesRef = useRef<SplashParticle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const nextTreatIdRef = useRef(1);
  const completedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const addScore = useCallback((pts: number) => {
    setScore((prev) => {
      const next = prev + pts;
      onScoreUpdate(next);
      return next;
    });
  }, [onScoreUpdate]);

  const spawnTreat = (canvasWidth: number) => {
    const isHazard = Math.random() < 0.2 && treatsRef.current.length > 2;
    const treat = isHazard
      ? { emoji: '🌧️', points: -50, isHazard: true, size: 26 }
      : TREAT_TYPES[Math.floor(Math.random() * TREAT_TYPES.length)];

    treatsRef.current.push({
      id: nextTreatIdRef.current++,
      x: Math.random() * (canvasWidth - 80) + 40,
      y: -40,
      speed: Math.random() * 2 + 2.5,
      size: treat.size,
      emoji: treat.emoji,
      points: treat.points,
      isHazard: treat.isHazard,
      caught: false,
    });
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pointer / Touch move tracking for basket
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    basketRef.current.x = Math.max(
      basketRef.current.width / 2,
      Math.min(canvas.width - basketRef.current.width / 2, clientX)
    );
  };

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        basketRef.current.x = canvas.width / 2;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let spawnTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Keyboard movement
      const keys = keysRef.current;
      const b = basketRef.current;
      if (keys['arrowleft'] || keys['keya'] || keys['a']) {
        b.x -= b.speed;
      }
      if (keys['arrowright'] || keys['keyd'] || keys['d']) {
        b.x += b.speed;
      }
      b.x = Math.max(b.width / 2, Math.min(canvas.width - b.width / 2, b.x));

      // Spawning treats
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        spawnTreat(canvas.width);
      }

      const basketY = canvas.height - 40;

      // Draw Basket / Glowing Birthday Plate
      ctx.save();
      ctx.shadowColor = 'rgba(236, 72, 153, 0.7)';
      ctx.shadowBlur = 16;

      const basketGrad = ctx.createLinearGradient(b.x - b.width / 2, basketY, b.x + b.width / 2, basketY);
      basketGrad.addColorStop(0, '#9333ea');
      basketGrad.addColorStop(0.5, '#ec4899');
      basketGrad.addColorStop(1, '#f59e0b');

      ctx.beginPath();
      ctx.roundRect(b.x - b.width / 2, basketY, b.width, b.height, 12);
      ctx.fillStyle = basketGrad;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Basket label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎂 SRAVYA TRAY', b.x, basketY + b.height / 2);
      ctx.restore();

      // Update & Draw Treats
      for (let i = treatsRef.current.length - 1; i >= 0; i--) {
        const treat = treatsRef.current[i];
        treat.y += treat.speed;

        // Collision with basket
        if (
          !treat.caught &&
          treat.y + treat.size >= basketY &&
          treat.y <= basketY + b.height &&
          treat.x >= b.x - b.width / 2 - 10 &&
          treat.x <= b.x + b.width / 2 + 10
        ) {
          treat.caught = true;

          if (treat.isHazard) {
            setCombo(0);
            soundManager.playPop();
          } else {
            soundManager.playCatch();
            setCombo((c) => c + 1);
            addScore(treat.points);

            // Splash particles
            for (let p = 0; p < 14; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = Math.random() * 4 + 1.5;
              particlesRef.current.push({
                x: treat.x,
                y: basketY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 2,
                color: '#ec4899',
                alpha: 1,
                size: Math.random() * 4 + 2,
              });
            }

            setCaughtCount((prev) => {
              const next = prev + 1;
              if (next >= TARGET_CATCH_COUNT && !completedRef.current) {
                completedRef.current = true;
                confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
                setTimeout(() => onComplete(), 750);
              }
              return next;
            });
          }
        }

        // Draw falling treat
        if (!treat.caught) {
          ctx.font = `${treat.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(treat.emoji, treat.x, treat.y);
        }

        // Remove offscreen or caught treats
        if (treat.y > canvas.height + 40 || treat.caught) {
          treatsRef.current.splice(i, 1);
        }
      }

      // Update & Draw Particles
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15;
        pt.alpha -= 0.035;

        if (pt.alpha <= 0) {
          particlesRef.current.splice(p, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [addScore, onComplete]);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] flex flex-col items-center justify-between p-3 select-none">
      {/* Top HUD */}
      <div className="z-10 w-full max-w-md glass-card p-3 rounded-2xl border border-purple-500/40 shadow-glow flex items-center justify-between text-xs sm:text-sm font-bold">
        <div className="flex items-center gap-1.5 text-pink-300">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Treats: {caughtCount} / {TARGET_CATCH_COUNT}</span>
        </div>
        {combo > 1 && (
          <span className="text-amber-300 animate-pulse">
            🔥 {combo}x STREAK
          </span>
        )}
        <div className="flex items-center gap-1 text-yellow-300">
          <Trophy className="w-3.5 h-3.5" /> {score} pts
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative flex-1 w-full rounded-2xl overflow-hidden touch-none cursor-ew-resize">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          className="w-full h-full block"
        />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/30 text-[11px] font-semibold text-purple-200 pointer-events-none backdrop-blur-md">
          👉 Drag with touch/mouse or use Left / Right arrows to move tray!
        </div>
      </div>

      {/* Touch Button Controls for Mobile */}
      <div className="z-10 mt-2 flex items-center justify-between w-full max-w-xs gap-3">
        <button
          onPointerDown={() => { keysRef.current['arrowleft'] = true; }}
          onPointerUp={() => { keysRef.current['arrowleft'] = false; }}
          onPointerLeave={() => { keysRef.current['arrowleft'] = false; }}
          className="p-3.5 flex-1 rounded-2xl glass-card border border-purple-500/40 text-purple-200 flex items-center justify-center active:bg-purple-600/40 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-pink-300" />
        </button>

        <button
          onClick={() => {
            setCaughtCount(0);
            setScore(0);
            setCombo(0);
            treatsRef.current = [];
            completedRef.current = false;
          }}
          className="p-3 rounded-2xl glass-card border border-purple-500/30 text-xs text-purple-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Restart Level"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onPointerDown={() => { keysRef.current['arrowright'] = true; }}
          onPointerUp={() => { keysRef.current['arrowright'] = false; }}
          onPointerLeave={() => { keysRef.current['arrowright'] = false; }}
          className="p-3.5 flex-1 rounded-2xl glass-card border border-purple-500/40 text-purple-200 flex items-center justify-center active:bg-purple-600/40 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowRight className="w-5 h-5 text-pink-300" />
        </button>
      </div>
    </div>
  );
};

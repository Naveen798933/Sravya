import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundManager } from '../../utils/soundManager';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BalloonPopGameProps {
  onComplete: () => void;
  onScoreUpdate: (score: number) => void;
}

interface Balloon {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  swayAmp: number;
  swaySpeed: number;
  swayOffset: number;
  color: string;
  glowColor: string;
  letter?: string;
  icon?: string;
  popped: boolean;
  type: 'letter' | 'bonus';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

const TARGET_LETTERS = ['S', 'R', 'A', 'V', 'Y', 'A'];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({ onComplete, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [collectedLetters, setCollectedLetters] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const lastPopTimeRef = useRef(0);

  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const nextBalloonIdRef = useRef(1);
  const completedRef = useRef(false);

  const addScore = useCallback((pts: number) => {
    setScore((prev) => {
      const next = prev + pts;
      onScoreUpdate(next);
      return next;
    });
  }, [onScoreUpdate]);

  const spawnBalloon = useCallback((width: number, height: number, specificLetter?: string): Balloon => {
    const isLetter = specificLetter !== undefined || (Math.random() < 0.6 && TARGET_LETTERS.length > 0);
    const uncollected = TARGET_LETTERS.filter((l) => !collectedLetters.includes(l));
    const letter = specificLetter || (isLetter && uncollected.length > 0
      ? uncollected[Math.floor(Math.random() * uncollected.length)]
      : undefined);

    const colors = [
      { color: '#ec4899', glow: 'rgba(236,72,153,0.6)' }, // Pink
      { color: '#a855f7', glow: 'rgba(168,85,247,0.6)' }, // Purple
      { color: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },  // Amber/Gold
      { color: '#38bdf8', glow: 'rgba(56,189,248,0.6)' },  // Sky
      { color: '#f43f5e', glow: 'rgba(244,63,94,0.6)' },   // Rose
    ];
    const col = colors[Math.floor(Math.random() * colors.length)];

    const icons = ['✨', '💖', '⭐', '🎂', '🎁'];
    const icon = letter ? undefined : icons[Math.floor(Math.random() * icons.length)];

    return {
      id: nextBalloonIdRef.current++,
      x: Math.random() * (width - 80) + 40,
      y: height + Math.random() * 40 + 30,
      radius: letter ? 34 : 28,
      speed: Math.random() * 1.5 + 1.6,
      swayAmp: Math.random() * 25 + 15,
      swaySpeed: Math.random() * 0.03 + 0.02,
      swayOffset: Math.random() * Math.PI * 2,
      color: letter ? '#f43f5e' : col.color,
      glowColor: letter ? 'rgba(244,63,94,0.7)' : col.glow,
      letter,
      icon,
      popped: false,
      type: letter ? 'letter' : 'bonus',
    };
  }, [collectedLetters]);

  // Initial population of balloons
  const initBalloons = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    balloonsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Ensure all 6 letters are generated across the opening set
    TARGET_LETTERS.forEach((l, i) => {
      const b = spawnBalloon(canvas.width, canvas.height, l);
      b.y = canvas.height - (i * 70 + 40);
      balloonsRef.current.push(b);
    });

    // Add extra ambient balloons
    for (let i = 0; i < 6; i++) {
      const b = spawnBalloon(canvas.width, canvas.height);
      b.y = canvas.height - (i * 60 + 20);
      balloonsRef.current.push(b);
    }
  }, [spawnBalloon]);

  // Pop interaction
  const popBalloonAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check hit balloons from top-most (reverse order)
    for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
      const b = balloonsRef.current[i];
      if (b.popped) continue;

      const dist = Math.hypot(x - b.x, y - b.y);
      if (dist <= b.radius + 12) {
        b.popped = true;
        soundManager.playPop();

        // Combo tracker
        const now = Date.now();
        if (now - lastPopTimeRef.current < 1200) {
          setCombo((c) => c + 1);
        } else {
          setCombo(1);
        }
        lastPopTimeRef.current = now;

        // Particles burst
        for (let p = 0; p < 20; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 6 + 2;
          particlesRef.current.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: b.color,
            alpha: 1,
            size: Math.random() * 5 + 3,
          });
        }

        // Floating score/letter text
        if (b.letter) {
          soundManager.playSparkleChime();
          floatingTextsRef.current.push({
            id: Date.now() + Math.random(),
            x: b.x,
            y: b.y,
            text: `+500 🌟 [${b.letter}]!`,
            color: '#fbbf24',
            alpha: 1,
          });
          addScore(500);

          setCollectedLetters((prev) => {
            if (!prev.includes(b.letter!)) {
              const next = [...prev, b.letter!];
              if (next.length >= TARGET_LETTERS.length && !completedRef.current) {
                completedRef.current = true;
                confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
                setTimeout(() => onComplete(), 700);
              }
              return next;
            }
            return prev;
          });
        } else {
          floatingTextsRef.current.push({
            id: Date.now() + Math.random(),
            x: b.x,
            y: b.y,
            text: '+100 ✨',
            color: '#ec4899',
            alpha: 1,
          });
          addScore(100);
        }

        break;
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    popBalloonAt(e.clientX, e.clientY);
  };

  // Main Canvas Render & Animation Loop
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
      }
    };
    resize();
    window.addEventListener('resize', resize);
    initBalloons();

    let step = 0;

    const render = () => {
      step++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background ambient stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let s = 0; s < 15; s++) {
        const sx = (s * 73 + step * 0.1) % canvas.width;
        const sy = (s * 57) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Update & Render Balloons
      balloonsRef.current.forEach((b) => {
        if (!b.popped) {
          b.y -= b.speed;
          b.x += Math.sin(step * b.swaySpeed + b.swayOffset) * 0.8;

          // If reached top, recycle to bottom
          if (b.y < -b.radius - 20) {
            b.y = canvas.height + 40;
            b.x = Math.random() * (canvas.width - 80) + 40;
          }

          // Draw balloon string
          ctx.beginPath();
          ctx.moveTo(b.x, b.y + b.radius);
          ctx.quadraticCurveTo(
            b.x + Math.sin(step * 0.05) * 6,
            b.y + b.radius + 15,
            b.x,
            b.y + b.radius + 28
          );
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw balloon body
          ctx.save();
          ctx.shadowColor = b.glowColor;
          ctx.shadowBlur = 16;

          // Gradient fill
          const grad = ctx.createRadialGradient(
            b.x - b.radius * 0.3,
            b.y - b.radius * 0.3,
            b.radius * 0.1,
            b.x,
            b.y,
            b.radius
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, b.color);
          grad.addColorStop(1, '#000000');

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();

          // Balloon knot
          ctx.beginPath();
          ctx.moveTo(b.x - 3, b.y + b.radius);
          ctx.lineTo(b.x + 3, b.y + b.radius);
          ctx.lineTo(b.x, b.y + b.radius + 4);
          ctx.closePath();
          ctx.fillStyle = b.color;
          ctx.fill();

          // Label / Letter / Emoji
          if (b.letter) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(b.letter, b.x, b.y);
          } else if (b.icon) {
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.icon, b.x, b.y);
          }
        }
      });

      // Update & Render Particles
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.15; // gravity
        pt.alpha -= 0.03;

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

      // Update & Render Floating Score Texts
      for (let t = floatingTextsRef.current.length - 1; t >= 0; t--) {
        const ft = floatingTextsRef.current[t];
        ft.y -= 1.2;
        ft.alpha -= 0.02;

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(t, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = ft.alpha;
          ctx.fillStyle = ft.color;
          ctx.font = 'bold 15px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          ctx.fillText(ft.text, ft.x, ft.y);
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
  }, [initBalloons]);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] flex flex-col items-center justify-between p-3 select-none">
      {/* Top HUD: Target Name Spell Progress */}
      <div className="z-10 w-full max-w-md glass-card p-3 rounded-2xl border border-purple-500/40 shadow-glow flex flex-col items-center gap-2">
        <div className="flex items-center justify-between w-full text-xs font-bold px-2 text-pink-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Pop balloons to spell S • R • A • V • Y • A:
          </span>
          <span className="flex items-center gap-1 text-purple-200">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" /> {score} pts
          </span>
        </div>

        {/* Letters spell tracker tiles */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {TARGET_LETTERS.map((letter, index) => {
            const isCollected = collectedLetters.includes(letter);
            return (
              <div
                key={index}
                className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl border-2 flex items-center justify-center font-black text-lg sm:text-xl transition-all duration-300 ${
                  isCollected
                    ? 'bg-gradient-to-t from-pink-600 to-amber-400 border-amber-300 text-white shadow-glow-pink scale-105'
                    : 'bg-purple-950/60 border-purple-500/30 text-purple-400/40'
                }`}
              >
                {isCollected ? letter : '?'}
              </div>
            );
          })}
        </div>

        {combo > 1 && (
          <div className="text-[11px] font-extrabold text-amber-300 tracking-wider animate-bounce">
            🔥 {combo}x COMBO POPPING STREAK!
          </div>
        )}
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full rounded-2xl overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="w-full h-full block"
        />

        {/* Floating Instruction Banner */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/30 text-[11px] font-semibold text-purple-200 pointer-events-none backdrop-blur-md">
          👉 Tap or Click any floating balloon to pop it!
        </div>
      </div>

      {/* Reset button */}
      <div className="z-10 mt-2 flex items-center gap-2">
        <button
          onClick={() => {
            setCollectedLetters([]);
            setScore(0);
            completedRef.current = false;
            initBalloons();
          }}
          className="px-3 py-1 rounded-xl glass-card border border-purple-500/30 text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset Balloons
        </button>
      </div>
    </div>
  );
};

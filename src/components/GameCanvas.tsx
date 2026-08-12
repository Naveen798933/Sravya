import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gameLevels } from '../config/birthdayConfig';
import type { LevelConfig } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { HelpCircle, Trophy, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameCanvasProps {
  currentLevelIndex: number;
  onLevelComplete: (levelId: number) => void;
  onAllLevelsComplete: () => void;
}

interface Item {
  id: string;
  x: number;
  y: number;
  type: 'heart' | 'star' | 'gift';
  size: number;
  collected: boolean;
  pulseOffset: number;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  depth: number;   // 0..1, lower = deeper = slower / dimmer
  speed: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentLevelIndex,
  onLevelComplete,
  onAllLevelsComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Game State ---
  const [level, setLevel] = useState<LevelConfig>(gameLevels[currentLevelIndex] || gameLevels[0]);
  const [score, setScore] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [showHelper, setShowHelper] = useState(false);
  const [levelUnlockedModal, setLevelUnlockedModal] = useState<LevelConfig | null>(null);

  // ── Ref for the current level so the game loop can read it without stale closure ──
  const levelRef        = useRef<LevelConfig>(gameLevels[currentLevelIndex] || gameLevels[0]);
  // ── Flag to prevent duplicate modal triggers (fixes stale-closure bug) ──
  const levelCompleteRef = useRef(false);
  // ── Pause the game loop when modal is open (don't recreate the loop) ──
  const pausedRef       = useRef(false);

  // Input states
  const keysRef    = useRef<{ [key: string]: boolean }>({});
  const touchDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Player state
  const playerRef = useRef({
    x: 200, y: 200, vx: 0, vy: 0,
    speed: 4.5, size: 28,
    direction: 'down', isMoving: false, animFrame: 0,
  });

  const itemsRef      = useRef<Item[]>([]);
  const sparklesRef   = useRef<Sparkle[]>([]);
  const obstaclesRef  = useRef<Obstacle[]>([]);
  const starsRef      = useRef<Star[]>([]);

  // --- Level Initializer ---
  const initLevel = useCallback((lvlIndex: number) => {
    const currentLvl = gameLevels[lvlIndex] || gameLevels[0];
    setLevel(currentLvl);
    levelRef.current = currentLvl;
    levelCompleteRef.current = false;
    pausedRef.current = false;
    setCollectedCount(0);

    const canvas = canvasRef.current;
    const width  = canvas ? canvas.width  : window.innerWidth;
    const height = canvas ? canvas.height : window.innerHeight - 100;

    playerRef.current.x = width  / 2;
    playerRef.current.y = height / 2;

    // Generate Collectibles
    const newItems: Item[] = [];
    const margin = 60;
    for (let i = 0; i < currentLvl.targetCount; i++) {
      newItems.push({
        id: `item-${i}`,
        x: Math.random() * (width  - margin * 2) + margin,
        y: Math.random() * (height - margin * 2) + margin,
        type: currentLvl.collectibleType,
        size: 22,
        collected: false,
        pulseOffset: (i / currentLvl.targetCount) * Math.PI * 2,
      });
    }
    itemsRef.current = newItems;

    // Generate obstacles for level 2 & 3
    const newObstacles: Obstacle[] = [];
    if (lvlIndex >= 1) {
      const count = lvlIndex === 1 ? 3 : 5;
      for (let i = 0; i < count; i++) {
        newObstacles.push({
          x: Math.random() * (width  - 100) + 50,
          y: Math.random() * (height - 100) + 50,
          radius: 18,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
        });
      }
    }
    obstaclesRef.current = newObstacles;

    // Generate parallax star field
    const newStars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      newStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size:  Math.random() * 1.5 + 0.5,
        depth: Math.random(),
        speed: Math.random() * 0.3 + 0.05,
      });
    }
    starsRef.current = newStars;
  }, []);

  useEffect(() => {
    initLevel(currentLevelIndex);
  }, [currentLevelIndex, initLevel]);

  // --- Keyboard Input (separate effect, never teardown) ---
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
    window.addEventListener('keyup',   handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup',   handleKeyUp);
    };
  }, []);

  // --- Canvas Game Loop (only depends on canvas mount, never recreated for modal) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const spawnSparkles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        sparklesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 4 + 2,
        });
      }
    };

    const update = () => {
      if (pausedRef.current) return;

      const player   = playerRef.current;
      const keys     = keysRef.current;
      const touchDir = touchDirRef.current;
      const lvl      = levelRef.current;

      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']    || keys['keyw']) dy -= 1;
      if (keys['s'] || keys['arrowdown']  || keys['keys']) dy += 1;
      if (keys['a'] || keys['arrowleft']  || keys['keya']) dx -= 1;
      if (keys['d'] || keys['arrowright'] || keys['keyd']) dx += 1;

      if (touchDir.dx !== 0 || touchDir.dy !== 0) {
        dx = touchDir.dx;
        dy = touchDir.dy;
      }

      // Normalize diagonal
      if (dx !== 0 && dy !== 0 && touchDir.dx === 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      player.isMoving = dx !== 0 || dy !== 0;
      player.x += dx * player.speed;
      player.y += dy * player.speed;
      player.x = Math.max(player.size, Math.min(canvas.width  - player.size, player.x));
      player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
      player.animFrame += 0.1;

      // Update obstacles
      obstaclesRef.current.forEach((obs) => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        if (obs.x - obs.radius < 0 || obs.x + obs.radius > canvas.width)  obs.vx *= -1;
        if (obs.y - obs.radius < 0 || obs.y + obs.radius > canvas.height) obs.vy *= -1;
      });

      // Item collision
      let newCollected = 0;
      itemsRef.current.forEach((item) => {
        if (item.collected) { newCollected++; return; }
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < player.size + item.size) {
          item.collected = true;
          soundManager.playPickup();
          setScore((prev) => prev + 100);
          const itemColor =
            item.type === 'heart' ? '#ec4899' :
            item.type === 'star'  ? '#fbbf24' : '#a855f7';
          spawnSparkles(item.x, item.y, itemColor);
          newCollected++;
        }
      });

      setCollectedCount(newCollected);

      // ── Level completion — use ref flag to prevent stale-closure double-fire ──
      if (newCollected >= lvl.targetCount && !levelCompleteRef.current) {
        levelCompleteRef.current = true;
        pausedRef.current = true;
        soundManager.playLevelClear();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setLevelUnlockedModal(lvl);
      }

      // Update sparkles
      for (let i = sparklesRef.current.length - 1; i >= 0; i--) {
        const sp = sparklesRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha -= 0.025;
        if (sp.alpha <= 0) sparklesRef.current.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Parallax Star Field (3 depth layers) ──
      const time = Date.now() * 0.0005;
      starsRef.current.forEach((star) => {
        const brightness = 0.2 + star.depth * 0.8;
        const drift = Math.sin(time * star.speed + star.y * 0.01) * 0.5;
        ctx.beginPath();
        ctx.arc(star.x + drift, star.y, star.size * star.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 180, 255, ${brightness * 0.6})`;
        ctx.fill();
      });

      // ── Grid dots ──
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      for (let x = 30; x < canvas.width; x += 70) {
        for (let y = 30; y < canvas.height; y += 70) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Obstacles (glowing orbs with inner gradient) ──
      obstaclesRef.current.forEach((obs) => {
        ctx.save();
        const grad = ctx.createRadialGradient(obs.x - 4, obs.y - 4, 2, obs.x, obs.y, obs.radius);
        grad.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.15)');
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur  = 18;
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // ── Collectibles with 3D float + glow ──
      const t = Date.now() * 0.003;
      itemsRef.current.forEach((item) => {
        if (item.collected) return;
        const floatY = item.y + Math.sin(t + item.pulseOffset) * 7;
        const scale  = 1 + Math.sin(t * 1.5 + item.pulseOffset) * 0.06;

        ctx.save();
        ctx.translate(item.x, floatY);
        ctx.scale(scale, scale);

        // Outer glow ring
        const ringColor =
          item.type === 'heart' ? 'rgba(236,72,153,0.25)' :
          item.type === 'star'  ? 'rgba(251,191,36,0.25)' :
                                  'rgba(168,85,247,0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = ringColor;
        ctx.fill();

        if (item.type === 'heart') {
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur  = 20;
        } else if (item.type === 'star') {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur  = 20;
        } else {
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur  = 20;
        }
        ctx.font = '26px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          item.type === 'heart' ? '❤️' :
          item.type === 'star'  ? '⭐' : '🎁',
          0, 0
        );
        ctx.restore();
      });

      // ── Sparkles ──
      sparklesRef.current.forEach((sp) => {
        ctx.save();
        ctx.globalAlpha  = sp.alpha;
        ctx.fillStyle    = sp.color;
        ctx.shadowColor  = sp.color;
        ctx.shadowBlur   = 10;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── Player (cute glowing hero with 3D aura ring) ──
      const player = playerRef.current;
      const bobY   = Math.sin(player.animFrame) * (player.isMoving ? 4 : 2);
      const auraT  = Date.now() * 0.002;

      ctx.save();
      ctx.translate(player.x, player.y + bobY);

      // Outer 3D aura ring (ellipse to simulate 3D perspective)
      ctx.beginPath();
      ctx.ellipse(0, player.size * 0.7, player.size + 8, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.fill();

      // Aura glow pulse
      const auraRadius = player.size + 6 + Math.sin(auraT) * 4;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur  = 28;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
      ctx.fill();

      // Main body
      ctx.beginPath();
      ctx.arc(0, 0, player.size, 0, Math.PI * 2);
      const bodyGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, player.size);
      bodyGrad.addColorStop(0, '#f9a8d4');
      bodyGrad.addColorStop(0.6, '#db2777');
      bodyGrad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = bodyGrad;
      ctx.shadowBlur = 0;
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8, -5, 4.5, 0, Math.PI * 2);
      ctx.arc( 8, -5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-7, -5, 2, 0, Math.PI * 2);
      ctx.arc( 7, -5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -6, 0.8, 0, Math.PI * 2);
      ctx.arc( 8, -6, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(0, 4, 5.5, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Crown
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', 0, -player.size - 2);

      ctx.restore();
    };

    const render = () => {
      update();
      draw();
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  // ── Only run once on mount — input & paused logic use refs ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextLevel = () => {
    if (!levelUnlockedModal) return;
    const finishedLevelId = levelUnlockedModal.id; // 1-indexed: 1, 2, or 3
    setLevelUnlockedModal(null);
    pausedRef.current = false;

    onLevelComplete(finishedLevelId);

    if (finishedLevelId < 3) {
      // finishedLevelId is 1 or 2; next level index = finishedLevelId (0-indexed next level)
      initLevel(finishedLevelId);
    } else {
      onAllLevelsComplete();
    }
  };

  const progressPercent = Math.min(100, Math.round((collectedCount / level.targetCount) * 100));

  const handleTouchDir = (dx: number, dy: number) => {
    touchDirRef.current = { dx, dy };
  };
  const handleTouchEnd = () => {
    touchDirRef.current = { dx: 0, dy: 0 };
  };

  return (
    <div className="relative w-full h-[calc(100dvh-70px)] overflow-hidden select-none touch-none">
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border border-purple-500/30 backdrop-blur-md animate-stagger-1">
            <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold text-purple-200">LVL {level.id}</span>
            <span className="text-xs text-purple-400">|</span>
            <span className="text-xs font-bold text-pink-300">{score} PTS</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 glass-card px-4 py-2 rounded-full border border-purple-500/30 text-xs text-purple-200 animate-stagger-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{level.objective}</span>
          </div>
        </div>

        <button
          onClick={() => setShowHelper(true)}
          className="p-2.5 rounded-full glass-card border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all animate-stagger-1"
          title="How to Play"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-16 left-4 right-4 z-20 max-w-md mx-auto animate-stagger-2">
        <div className="glass-card p-2 rounded-2xl border border-purple-500/30 flex items-center gap-3">
          <span className="text-xl">
            {level.collectibleType === 'heart' ? '❤️' : level.collectibleType === 'star' ? '⭐' : '🎁'}
          </span>
          <div className="flex-1 h-3 bg-purple-950/80 rounded-full overflow-hidden border border-purple-500/30 relative">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-300 shadow-glow rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Shimmer on progress */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_linear_infinite]" />
          </div>
          <span className="text-xs font-bold text-purple-200 min-w-[45px]">
            {collectedCount}/{level.targetCount}
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Mobile Virtual D-Pad */}
      <div className="absolute bottom-6 left-6 z-30 sm:hidden pointer-events-auto select-none">
        <div className="relative w-36 h-36 rounded-full glass-card border border-purple-500/40 p-2 flex items-center justify-center backdrop-blur-lg">
          {/* UP */}
          <button
            onTouchStart={() => handleTouchDir(0, -1)} onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchDir(0, -1)}  onMouseUp={handleTouchEnd}
            className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-purple-600/40 active:bg-pink-500 flex items-center justify-center text-white border border-purple-400/40 transition-colors"
          ><ArrowUp className="w-5 h-5" /></button>
          {/* DOWN */}
          <button
            onTouchStart={() => handleTouchDir(0, 1)} onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchDir(0, 1)}  onMouseUp={handleTouchEnd}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-purple-600/40 active:bg-pink-500 flex items-center justify-center text-white border border-purple-400/40 transition-colors"
          ><ArrowDown className="w-5 h-5" /></button>
          {/* LEFT */}
          <button
            onTouchStart={() => handleTouchDir(-1, 0)} onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchDir(-1, 0)}  onMouseUp={handleTouchEnd}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-purple-600/40 active:bg-pink-500 flex items-center justify-center text-white border border-purple-400/40 transition-colors"
          ><ArrowLeft className="w-5 h-5" /></button>
          {/* RIGHT */}
          <button
            onTouchStart={() => handleTouchDir(1, 0)} onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchDir(1, 0)}  onMouseUp={handleTouchEnd}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-purple-600/40 active:bg-pink-500 flex items-center justify-center text-white border border-purple-400/40 transition-colors"
          ><ArrowRight className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-purple-400/30 border border-purple-300/40 animate-pulse" />
        </div>
      </div>

      {/* Desktop Controls Hint */}
      <div className="hidden sm:block absolute bottom-6 right-6 z-20 pointer-events-none">
        <div className="glass-card px-4 py-2.5 rounded-2xl border border-purple-500/30 flex items-center gap-3 text-xs text-purple-200 animate-fade-in">
          <span className="font-semibold text-purple-300">Controls:</span>
          <span className="px-2 py-1 bg-purple-900/60 rounded border border-purple-500/40 font-mono">WASD</span>
          <span>or</span>
          <span className="px-2 py-1 bg-purple-900/60 rounded border border-purple-500/40 font-mono">Arrow Keys</span>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-purple-500/40 text-center space-y-4 animate-scale-up">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
              🎮 How to Play
            </h3>
            <p className="text-xs text-purple-200 leading-relaxed">
              Use keyboard keys <code className="bg-purple-900/80 px-1.5 py-0.5 rounded text-pink-300">WASD</code> / <code className="bg-purple-900/80 px-1.5 py-0.5 rounded text-pink-300">Arrows</code> on desktop or the on-screen joystick on mobile to guide your cute character!
            </p>
            <div className="space-y-2 text-left text-xs text-purple-300 bg-purple-950/50 p-3 rounded-xl border border-purple-500/20">
              <p>❤️ <b>Level 1:</b> Gather 5 hearts</p>
              <p>⭐ <b>Level 2:</b> Gather 8 stars</p>
              <p>🎁 <b>Level 3:</b> Gather 10 gifts</p>
            </div>
            <button
              onClick={() => setShowHelper(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all btn-3d"
            >
              Got it, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {levelUnlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-purple-400/50 text-center space-y-6 animate-card-flip-in shadow-2xl shadow-purple-500/30">
            <div className="animate-stagger-1">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-glow animate-glow-3d">
                {levelUnlockedModal.id === 1 ? '💌' : levelUnlockedModal.id === 2 ? '✨' : '🎁'}
              </div>
            </div>

            <div className="animate-stagger-2">
              <span className="text-xs uppercase tracking-widest text-pink-400 font-bold">LEVEL COMPLETE!</span>
              <h2 className="text-2xl font-black text-white mt-1">{levelUnlockedModal.unlockedTitle}</h2>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-sm leading-relaxed animate-stagger-3">
              "{levelUnlockedModal.unlockedMessage}"
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-base shadow-lg shadow-purple-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 group btn-3d animate-stagger-4"
            >
              <span>{levelUnlockedModal.id === 3 ? "Unlock Sravya's Birthday Memory 🔒" : "Continue to Next Level"}</span>
              <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

interface FireworksCanvasProps {
  active: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
  gravity: number;
  type: 'spark' | 'confetti' | 'ring';
  rotation: number;
  rotSpeed: number;
  trail: Array<{ x: number; y: number }>;
}

interface Rocket {
  x: number; y: number;
  targetY: number;
  vy: number;
  color: string;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export const FireworksCanvas: React.FC<FireworksCanvasProps> = ({ active, intensity = 'medium' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let rockets: Rocket[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      '#a855f7', '#ec4899', '#f43f5e', '#3b82f6',
      '#10b981', '#f59e0b', '#fbbf24', '#ffffff',
      '#c084fc', '#f9a8d4',
    ];

    const createExplosion = (x: number, y: number, color: string) => {
      soundManager.playFirework();

      const particleCount = intensity === 'high' ? 90 : intensity === 'medium' ? 60 : 35;

      // Main burst
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.4 - 0.2);
        const speed = Math.random() * 7 + 2;
        const type: Particle['type'] = Math.random() > 0.5 ? 'spark' : Math.random() > 0.5 ? 'confetti' : 'ring';
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: Math.random() > 0.35 ? color : colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3.5 + 1.5,
          decay: Math.random() * 0.012 + 0.008,
          gravity: 0.1 + Math.random() * 0.05,
          type,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          trail: [],
        });
      }

      // Secondary smaller ring burst
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        const speed = Math.random() * 3 + 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.sin(angle) * speed * 0.5,
          alpha: 0.8,
          color,
          size: 2,
          decay: 0.02,
          gravity: 0.05,
          type: 'spark',
          rotation: 0,
          rotSpeed: 0,
          trail: [],
        });
      }
    };

    const launchRocket = () => {
      const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
      const targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.05;
      rockets.push({
        x, y: canvas.height,
        targetY,
        vy: -(Math.random() * 5 + 9),
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    };

    const launchInterval = setInterval(
      launchRocket,
      intensity === 'high' ? 280 : intensity === 'medium' ? 550 : 900
    );

    // Initial burst salvo
    for (let i = 0; i < 4; i++) setTimeout(launchRocket, i * 180);

    const render = () => {
      // Subtle fade trail
      ctx.fillStyle = 'rgba(13, 7, 20, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Rockets with glowing trails ──
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y, alpha: 1 });
        if (r.trail.length > 12) r.trail.shift();

        // Draw trail
        r.trail.forEach((tp, idx) => {
          const a = (idx / r.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, 2.5 - (idx / r.trail.length) * 2, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.globalAlpha = a;
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        r.y += r.vy;

        // Rocket head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.shadowBlur  = 14;
        ctx.shadowColor = r.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (r.y <= r.targetY) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // ── Particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.vy *= 0.99;
        p.alpha    -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        } else if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + 1, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth   = 1.5;
          ctx.shadowColor = p.color;
          ctx.shadowBlur  = 6;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle   = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur  = 8;
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(launchInterval);
      window.removeEventListener('resize', resize);
    };
  }, [active, intensity]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      // z-40: below z-50 modals so proceed buttons remain clickable
      className="fixed inset-0 pointer-events-none z-40 w-full h-full"
    />
  );
};

import { useState, useMemo, useRef, useCallback } from 'react';
import { birthdayConfig, birthdayMessages } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { Gift, Sparkles, Heart, Star, Shield } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

interface ParticleData {
  id: number;
  left: string;
  top: string;
  fontSize: string;
  delay: string;
  duration: string;
  emoji: string;
  pz: string;
}

// Stable ambient floating particle component — uses useMemo to prevent re-render flicker
function AmbientParticles() {
  const particles = useMemo<ParticleData[]>(() => {
    const emojis = ['✨', '🌟', '💜', '🌸', '⭐', '💫', '🎀', '🌺'];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top:  `${(i * 53 + 7)  % 100}%`,
      fontSize: `${((i * 7 + 8) % 12) + 10}px`,
      delay:    `${(i * 0.4)  % 6}s`,
      duration: `${4 + ((i * 1.3) % 6)}s`,
      emoji:    emojis[i % emojis.length],
      pz:       `${((i * 17) % 60) - 30}px`,
    }));
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden preserve-3d"
      aria-hidden="true"
      style={{ perspective: '600px' }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute select-none"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.fontSize,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--pz': p.pz,
            animation: `float3dParticle ${p.duration} ease-in-out ${p.delay} infinite`,
            opacity: 0.45,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [clicked, setClicked] = useState(false);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleStartClick = () => {
    if (clicked) return;
    setClicked(true);
    soundManager.startMusic();
    soundManager.playClick();
    setTimeout(onStart, 350);
  };

  // 3D mouse-tracking tilt on the hero card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!heroCardRef.current) return;
      const rotateX = -dy * 8;
      const rotateY =  dx * 8;
      heroCardRef.current.style.transform =
        `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!heroCardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    heroCardRef.current.style.transform =
      'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }, []);

  const features = [
    { icon: <Sparkles className="w-4 h-4 text-purple-400" />, label: '3 Game Levels', delay: 'animate-stagger-3' },
    { icon: <Gift      className="w-4 h-4 text-pink-400"   />, label: 'Memory Reveal', delay: 'animate-stagger-4' },
    { icon: <Shield    className="w-4 h-4 text-amber-400"  />, label: 'Cake & Fireworks', delay: 'animate-stagger-5' },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-70px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Ambient glowing orbs with depth layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true"
        style={{ perspective: '800px', perspectiveOrigin: '50% 40%' }}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-700/20 rounded-full blur-[150px] orb-depth-1" />
        <div className="absolute bottom-1/4 right-1/4  w-[400px] h-[400px] bg-pink-600/20  rounded-full blur-[110px] orb-depth-2" />
        <div className="absolute top-1/2  left-1/4    w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[90px]  orb-depth-3" />
      </div>

      <AmbientParticles />

      {/* Hero Content */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-6 animate-phase-enter">
        {/* Mission Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-purple-500/40 text-xs font-bold text-pink-300 shadow-glow animate-stagger-1">
          <Sparkles className="w-4 h-4 text-amber-300" style={{ animation: 'starSpin 3s linear infinite' }} />
          <span>✦ A BELATED BIRTHDAY QUEST FILLED WITH MAGIC ✦</span>
        </div>

        {/* Hero Glass Card — 3D tilt on hover */}
        <div
          ref={heroCardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="card-3d glass-card p-8 sm:p-12 rounded-3xl border border-purple-400/40 shadow-2xl shadow-purple-900/60 relative overflow-hidden animate-stagger-2"
          style={{ transition: 'transform 0.12s ease-out, box-shadow 0.12s ease-out' }}
        >
          {/* Inner glow orbs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-pink-500/25   rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

          {/* Floating 3D Holographic Ribbon */}
          <div className="hologram-3d-ribbon -top-6 -left-10 w-44 h-16 opacity-60" />
          <div className="hologram-3d-ribbon -bottom-6 -right-10 w-44 h-16 opacity-60" style={{ animationDelay: '-6s' }} />

          <div className="relative z-10 space-y-6">
            {/* DOB Badge & Belated Tag */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-400/30 text-xs font-semibold text-purple-200">
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Born {birthdayConfig.dobFormatted}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-950/70 border border-pink-400/30 text-xs font-bold text-pink-300">
                <span>🎂 18 Years of Magic</span>
              </div>
            </div>

            {/* Name Reveal with 3D depth animation */}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-pink-400 font-extrabold animate-stagger-2">
                ✦ BELATED HAPPY BIRTHDAY ✦
              </p>
              <h1
                className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-pink-200 to-amber-200 text-glow-purple animate-hero-name"
              >
                {birthdayConfig.name}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed animate-stagger-3">
              "{birthdayMessages.introSub}"
            </p>

            {/* CTA Button with 3D press effect */}
            <button
              onClick={handleStartClick}
              id="start-birthday-quest"
              aria-label="Start the birthday surprise quest"
              disabled={clicked}
              className="btn-3d group relative w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-lg sm:text-xl shadow-2xl shadow-pink-900/60 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-80 disabled:cursor-wait animate-stagger-4 cursor-pointer"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-in-out" />
              <Gift className="w-6 h-6 animate-bounce text-yellow-200 relative z-10" />
              <span className="relative z-10">{clicked ? 'Loading Quest...' : '🎁 Start the Belated Surprise Quest'}</span>
              <Heart className="w-5 h-5 text-pink-200 fill-pink-200 relative z-10 animate-heartbeat" />
            </button>
          </div>
        </div>

        {/* Feature Highlights with stagger */}
        <div className="grid grid-cols-3 gap-3 text-xs text-purple-300 font-medium">
          {features.map(({ icon, label, delay }) => (
            <div
              key={label}
              className={`glass-card p-3 rounded-2xl border border-purple-500/20 flex flex-col items-center gap-1.5 hover:border-purple-400/40 hover:shadow-glow transition-all duration-300 hover:-translate-y-1 ${delay}`}
            >
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

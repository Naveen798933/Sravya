import React, { useEffect, useState } from 'react';
import { birthdayConfig, birthdayMessages, birthdayWishesCards, type WishCard } from '../config/birthdayConfig';
import { soundManager } from '../utils/soundManager';
import { FireworksCanvas } from './FireworksCanvas';
import { Heart, Sparkles, RefreshCw, Star, Share2, Check, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalSurpriseModalProps {
  onRestartQuest: () => void;
}

export const FinalSurpriseModal: React.FC<FinalSurpriseModalProps> = ({ onRestartQuest }) => {
  const [openedWishId, setOpenedWishId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    soundManager.playLevelClear();

    const duration = 4500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleWishCardClick = (card: WishCard) => {
    if (openedWishId === card.id) {
      setOpenedWishId(null);
      return;
    }
    setOpenedWishId(card.id);
    soundManager.playWishUnlock();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#a855f7', '#ec4899', '#fbbf24'],
    });
  };

  const handleShare = async () => {
    soundManager.playSparkleChime();
    const shareUrl = window.location.href;
    const shareData = {
      title: `Happy Birthday ${birthdayConfig.name}! 🎂`,
      text: `Join the magical birthday surprise quest for ${birthdayConfig.name}! ✨`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <FireworksCanvas active={true} intensity="high" />

      <div className="relative max-w-2xl w-full z-10 text-center space-y-6 my-auto pt-6 pb-10">

        {/* Giant 3D Glowing Heart with Orbit Rings */}
        <div className="relative flex justify-center animate-stagger-1 my-2">
          {/* Orbit rings around the heart */}
          <div
            className="absolute pointer-events-none"
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

            {/* Ring 2 */}
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
            </div>

            {/* Ring 3 */}
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
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 flex items-center justify-center animate-glow-3d cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              soundManager.playSparkleChime();
              confetti({ particleCount: 35, spread: 80, origin: { y: 0.3 } });
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #db2777, #f59e0b)',
              boxShadow: '0 0 50px rgba(168,85,247,0.6), 0 0 100px rgba(236,72,153,0.3)',
            }}
          >
            <div className="w-full h-full rounded-full bg-purple-950/85 flex items-center justify-center backdrop-blur-md">
              <Heart
                className="w-14 h-14 sm:w-18 sm:h-18 text-pink-400 fill-pink-400 animate-heartbeat"
                style={{ filter: 'drop-shadow(0 0 20px #ec4899)' }}
              />
            </div>
          </div>
        </div>

        {/* Content with staggered entrance */}
        <div className="space-y-4">
          {/* Victory badge */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-400/40 text-xs font-bold text-pink-300 shadow-glow animate-stagger-2">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-star-pop" />
            <span>QUEST COMPLETED — BIRTHDAY VICTORY!</span>
            <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-star-pop" style={{ animationDelay: '0.15s' }} />
          </div>

          {/* Main title */}
          <h1
            className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-amber-200 tracking-tight animate-stagger-3 text-glow-pink"
            style={{ lineHeight: 1.15 }}
          >
            {birthdayMessages.finalTitle}
          </h1>

          <p className="text-xs font-bold tracking-widest text-purple-300 uppercase">
            ✦ {birthdayConfig.dobFormatted} • CELEBRATING 18 MAGICAL YEARS ✦
          </p>

          {/* Message card */}
          <div
            className="glass-card p-5 sm:p-7 rounded-3xl border border-purple-400/50 shadow-2xl space-y-3 text-purple-100 text-sm sm:text-base leading-relaxed text-left bg-purple-950/40 animate-stagger-4"
            style={{ boxShadow: '0 0 40px rgba(168,85,247,0.2), 0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2 text-pink-300 font-bold">
                <Sparkles className="w-5 h-5 text-amber-400" style={{ animation: 'starSpin 3s linear infinite' }} />
                <span>A Personal Birthday Note</span>
              </div>
              <button
                onClick={() => setShowPhotoModal(!showPhotoModal)}
                className="px-3 py-1 rounded-xl bg-purple-800/50 hover:bg-purple-700/60 border border-purple-400/30 text-xs font-semibold text-pink-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showPhotoModal ? 'Hide Photo' : 'View Memory Photo'}</span>
              </button>
            </div>
            
            {showPhotoModal && (
              <div className="py-2 animate-fade-in flex justify-center">
                <div className="relative max-w-[220px] rounded-2xl overflow-hidden border border-purple-400/50 shadow-glow">
                  <img
                    src={birthdayConfig.photoUrl}
                    alt={birthdayConfig.name}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                    <p className="text-[11px] font-bold text-pink-200">{birthdayConfig.name}</p>
                  </div>
                </div>
              </div>
            )}

            <p>{birthdayMessages.finalMessage}</p>
          </div>

          {/* Interactive Birthday Wish & Blessing Cards */}
          <div className="space-y-3 pt-2 text-left">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs uppercase tracking-wider font-bold text-pink-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Tap to Unlock Special Birthday Blessings:
              </h3>
              <span className="text-[11px] text-purple-300 font-medium">
                {openedWishId ? '1 opened' : '4 hidden'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {birthdayWishesCards.map((card) => {
                const isOpen = openedWishId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => handleWishCardClick(card)}
                    className={`glass-card p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none bg-gradient-to-br ${
                      card.color
                    } ${
                      isOpen
                        ? 'scale-[1.02] shadow-glow-pink ring-1 ring-pink-400/50'
                        : 'hover:scale-[1.01] hover:border-purple-300/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl p-1 rounded-xl bg-purple-950/60 border border-purple-500/30 flex-shrink-0">
                        {card.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm truncate">{card.title}</h4>
                          <span className="text-[10px] text-pink-300 font-semibold px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-400/20">
                            {isOpen ? 'Unlocked ✨' : 'Tap to reveal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-200/80 font-medium">{card.subtitle}</p>
                        
                        {isOpen && (
                          <p className="text-xs text-pink-100 font-medium mt-2 pt-2 border-t border-purple-400/20 animate-fade-in leading-relaxed">
                            "{card.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-stagger-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="btn-3d w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 overflow-hidden relative group cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-300" /> : <Share2 className="w-4 h-4 text-pink-200" />}
              <span>{copiedLink ? 'Link Copied to Clipboard! 🎉' : 'Share Celebration Link 💌'}</span>
            </button>

            <button
              onClick={() => { soundManager.playClick(); onRestartQuest(); }}
              className="btn-3d w-full py-3.5 rounded-2xl bg-purple-900/80 hover:bg-purple-800/90 border border-purple-400/40 text-purple-100 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" />
              <span>Replay Quest 🎮</span>
            </button>
          </div>

          <div className="text-center space-y-1 text-xs text-purple-300 pt-2">
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


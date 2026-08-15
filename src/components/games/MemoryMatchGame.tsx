import React, { useState, useRef } from 'react';
import { soundManager } from '../../utils/soundManager';
import { Sparkles, Trophy, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemoryMatchGameProps {
  onComplete: () => void;
  onScoreUpdate: (score: number) => void;
}

interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS_DATA = [
  { pairId: 1, emoji: '🎂', label: 'Birthday Cake', color: 'from-pink-500/30 to-purple-600/30 border-pink-400/50' },
  { pairId: 2, emoji: '🎁', label: 'Secret Gift',   color: 'from-amber-500/30 to-yellow-600/30 border-amber-400/50' },
  { pairId: 3, emoji: '👑', label: 'Queen Crown',   color: 'from-yellow-400/30 to-amber-500/30 border-yellow-300/50' },
  { pairId: 4, emoji: '💖', label: 'Heart of Gold', color: 'from-rose-500/30 to-pink-600/30 border-rose-400/50' },
  { pairId: 5, emoji: '🌸', label: 'Cherry Bloom',  color: 'from-fuchsia-500/30 to-pink-500/30 border-fuchsia-400/50' },
  { pairId: 6, emoji: '✨', label: 'Starlight',     color: 'from-indigo-500/30 to-purple-500/30 border-indigo-400/50' },
];

function generateShuffledCards(): CardItem[] {
  const cards: CardItem[] = [];
  let id = 1;

  PAIRS_DATA.forEach((pair) => {
    // 2 cards per pair
    cards.push({ id: id++, pairId: pair.pairId, emoji: pair.emoji, label: pair.label, color: pair.color, isFlipped: false, isMatched: false });
    cards.push({ id: id++, pairId: pair.pairId, emoji: pair.emoji, label: pair.label, color: pair.color, isFlipped: false, isMatched: false });
  });

  // Fisher-Yates Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onComplete, onScoreUpdate }) => {
  const [cards, setCards] = useState<CardItem[]>(generateShuffledCards);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const completedRef = useRef(false);

  const resetGame = () => {
    setCards(generateShuffledCards());
    setSelectedCards([]);
    setIsChecking(false);
    setMoves(0);
    setMatchesCount(0);
    completedRef.current = false;
  };

  const handleCardClick = (index: number) => {
    if (isChecking) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    soundManager.playCardFlip();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND!
        setTimeout(() => {
          soundManager.playCardMatch();
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsChecking(false);

          setMatchesCount((prev) => {
            const next = prev + 1;
            onScoreUpdate(next * 250);

            if (next === PAIRS_DATA.length && !completedRef.current) {
              completedRef.current = true;
              confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
              setTimeout(onComplete, 800);
            }
            return next;
          });
        }, 400);
      } else {
        // NO MATCH -> Flip back
        setTimeout(() => {
          firstCard.isFlipped = false;
          secondCard.isFlipped = false;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsChecking(false);
        }, 900);
      }
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-between p-3 select-none">
      {/* Top HUD */}
      <div className="w-full glass-card p-3 rounded-2xl border border-purple-500/40 shadow-glow mb-4 flex items-center justify-between text-xs sm:text-sm font-bold">
        <div className="flex items-center gap-1.5 text-pink-300">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Matched: {matchesCount} / {PAIRS_DATA.length} Pairs</span>
        </div>
        <div className="flex items-center gap-3 text-purple-200">
          <span>Flips: <strong className="text-white">{moves}</strong></span>
          <span className="flex items-center gap-1 text-yellow-300">
            <Trophy className="w-3.5 h-3.5" /> {matchesCount * 250} pts
          </span>
        </div>
      </div>

      {/* 3D Memory Card Grid */}
      <div
        className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full py-2"
        style={{ perspective: '1000px' }}
      >
        {cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              disabled={isRevealed || isChecking}
              className={`relative aspect-[3/4] sm:aspect-square rounded-2xl transition-all duration-500 cursor-pointer focus:outline-none ${
                card.isMatched
                  ? 'ring-2 ring-amber-400/80 shadow-glow-amber scale-95 opacity-90'
                  : 'hover:scale-[1.03] active:scale-95'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Card Back (Hidden / Face Down) */}
              <div
                className="absolute inset-0 rounded-2xl glass-card border border-purple-400/40 flex flex-col items-center justify-center bg-gradient-to-tr from-purple-950/90 via-purple-900/80 to-pink-950/90 shadow-lg"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="w-8 h-8 rounded-full bg-purple-800/40 border border-purple-400/30 flex items-center justify-center text-purple-300 text-sm">
                  ✨
                </div>
                <span className="text-[10px] text-pink-300/70 font-bold mt-1">SRAVYA</span>
              </div>

              {/* Card Front (Revealed / Face Up) */}
              <div
                className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center p-2 bg-gradient-to-br ${
                  card.color
                } shadow-2xl backdrop-blur-md`}
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <span className="text-3xl sm:text-4xl drop-shadow-md animate-bounce-short">
                  {card.emoji}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-white tracking-tight mt-1 text-center truncate w-full">
                  {card.label}
                </span>
                {card.isMatched && (
                  <div className="absolute top-1 right-1">
                    <Award className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Reset button */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={resetGame}
          className="px-4 py-1.5 rounded-xl glass-card border border-purple-500/30 text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Shuffle & Restart
        </button>
      </div>
    </div>
  );
};

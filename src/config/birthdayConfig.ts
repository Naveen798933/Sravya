export interface BirthdayConfig {
  name: string;
  dob: string;
  dobFormatted: string;
  developer: string;
  instagramUsername: string;
  instagramUrl: string;
  photoUrl: string;
}

export interface LevelConfig {
  id: number;
  title: string;
  theme: string;
  objective: string;
  collectibleType: 'heart' | 'star' | 'gift';
  targetCount: number;
  unlockedTitle: string;
  unlockedMessage: string;
  bgColor: string;
}

export const birthdayConfig: BirthdayConfig = {
  name: "GUDAPATI SRAVYA",
  dob: "2006-08-14",
  dobFormatted: "14 • 08 • 2006",
  developer: "Gully_Developer",
  instagramUsername: "gully_developer",
  instagramUrl: "https://www.instagram.com/gully_developer/",
  photoUrl: "./sravya_photo.png",
};

export interface WishCard {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  message: string;
  color: string;
}

export const birthdayWishesCards: WishCard[] = [
  {
    id: 1,
    icon: '✨',
    title: 'Endless Happiness',
    subtitle: 'Joy & Bright Smiles',
    message: 'May every single day bring you countless reasons to smile, laughter with loved ones, and pure warmth in your heart!',
    color: 'from-amber-500/20 to-pink-500/20 border-amber-400/40',
  },
  {
    id: 2,
    icon: '🌟',
    title: 'Boundless Success',
    subtitle: 'Shine in All You Do',
    message: 'Wishing you towering achievements in all your studies, career goals, and creative pursuits. You have the power to achieve greatness!',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-400/40',
  },
  {
    id: 3,
    icon: '💖',
    title: 'True Friendship',
    subtitle: 'Unbreakable Bonds',
    message: 'Surround yourself with genuine companionship, loving memories, and friends who always support and cherish you!',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-400/40',
  },
  {
    id: 4,
    icon: '🌸',
    title: 'Dream Big & Bold',
    subtitle: '18th Milestone Year',
    message: 'Step courageously into this special year with wonder, curiosity, and fearless confidence. The future belongs to you, Sravya!',
    color: 'from-fuchsia-500/20 to-purple-600/20 border-fuchsia-400/40',
  },
];

export const birthdayMessages = {
  introTitle: "A Secret Birthday Mission Awaits...",
  introSub: "Welcome Sravya! A special quest created with love just for you.",
  introStory: "Deep inside this magical realm, secret birthday treasures lie hidden. Step forth, collect the magic, and unlock your special birthday surprise!",
  
  level1UnlockTitle: "💌 Level 1 Clear — A Special Birthday Wish",
  level1UnlockMsg: "Happy Birthday Sravya! May your day shine as bright as your smile. Your journey of magical surprises has officially begun!",
  
  level2UnlockTitle: "✨ Level 2 Clear — Something Special Is Waiting...",
  level2UnlockMsg: "You've collected the starlight! Memories and joy surround you today. Keep going — your secret birthday memory is right around the corner!",
  
  level3UnlockTitle: "🎁 Quest Complete — Secret Memory Unlocked!",
  level3UnlockMsg: "Brilliant job Sravya! You've unlocked the special memory card & your birthday celebration cake!",
  
  photoCaption: "A beautiful moment worth celebrating — Happy Birthday Gudapati Sravya!",
  
  cakeTitle: "HAPPY BIRTHDAY SRAVYA! 🎂",
  cakeSub: "14 August 2006 • Blow or tap the candles to launch the grand fireworks!",
  
  finalTitle: "HAPPY BIRTHDAY, SRAVYA! 💜🎂",
  finalMessage: "To an amazing person on her special day! May your 18th year and beyond be filled with infinite happiness, boundless success, and unforgettable moments. Never stop shining!",
  
  footerText: "Made with 💜 for a special birthday",
};

export const gameLevels: LevelConfig[] = [
  {
    id: 1,
    title: "Soft Magical World",
    theme: "Collect Hearts",
    objective: "Gather 5 magical hearts to unlock the first secret wish 💌",
    collectibleType: "heart",
    targetCount: 5,
    unlockedTitle: birthdayMessages.level1UnlockTitle,
    unlockedMessage: birthdayMessages.level1UnlockMsg,
    bgColor: "linear-gradient(135deg, #1e0936 0%, #32105c 100%)",
  },
  {
    id: 2,
    title: "Collect the Magic",
    theme: "Hearts & Stars",
    objective: "Gather 8 stars drifting through the starlight realm ✨",
    collectibleType: "star",
    targetCount: 8,
    unlockedTitle: birthdayMessages.level2UnlockTitle,
    unlockedMessage: birthdayMessages.level2UnlockMsg,
    bgColor: "linear-gradient(135deg, #150930 0%, #4c1d95 100%)",
  },
  {
    id: 3,
    title: "The Secret Gift",
    theme: "Golden Gifts",
    objective: "Gather 10 secret birthday gifts to unlock the memory card 🎁",
    collectibleType: "gift",
    targetCount: 10,
    unlockedTitle: birthdayMessages.level3UnlockTitle,
    unlockedMessage: birthdayMessages.level3UnlockMsg,
    bgColor: "linear-gradient(135deg, #09092b 0%, #581c87 100%)",
  },
];

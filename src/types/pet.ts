export interface PetStats {
  hunger: number;      // 0-100, lower is hungrier
  happiness: number;   // 0-100, higher is happier
  energy: number;      // 0-100, lower is more tired
  hygiene: number;     // 0-100, lower is dirtier
}

export type PetMood = 'happy' | 'neutral' | 'sad' | 'sleeping' | 'eating' | 'playing' | 'dirty' | 'dead';

export interface BrainRotCharacter {
  id: string;
  name: string;
  italianName: string;
  description: string;
  emoji: string;
  evolvedEmoji: string;
  image: string;
  evolvedImage: string;
  color: string;
  catchphrase: string;
  evolvedCatchphrase: string;
}

export type UpgradeId = 'autoFeeder' | 'autoPlayer' | 'autoRest' | 'autoCleaner' | 'clickPower' | 'xpBoost' | 'coinBoost';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effect: number; // Base effect value per level
}

export interface OwnedUpgrade {
  id: UpgradeId;
  level: number;
}

export interface Pet {
  character: BrainRotCharacter;
  stats: PetStats;
  mood: PetMood;
  age: number;         // in minutes
  isAlive: boolean;
  lastUpdated: number; // timestamp
  xp: number;
  level: number;
  coins: number;
  totalClicks: number;
  isEvolved: boolean;
  upgrades: OwnedUpgrade[];
}

export const BRAIN_ROT_CHARACTERS: BrainRotCharacter[] = [
  {
    id: 'tralalero',
    name: 'Shark with Legs',
    italianName: 'Tralalero Tralala',
    description: 'A majestic shark that evolved legs and walks on land',
    emoji: '🦈',
    evolvedEmoji: '🦈👑',
    image: 'https://i.imgur.com/QJhKvGM.png',
    evolvedImage: 'https://i.imgur.com/Y5qKvGN.png',
    color: '#4a90d9',
    catchphrase: 'Tralalero Tralala! 🦈🦵',
    evolvedCatchphrase: 'MEGA Tralalero Tralala! 🦈👑🦵'
  },
  {
    id: 'bombardiro',
    name: 'Bomber Crocodile',
    italianName: 'Bombardiro Crocodilo',
    description: 'A crocodile merged with a plane, ready for takeoff',
    emoji: '🐊',
    evolvedEmoji: '🐊✈️',
    image: 'https://i.imgur.com/RKhLvHN.png',
    evolvedImage: 'https://i.imgur.com/TLhMwIO.png',
    color: '#2d5a27',
    catchphrase: 'Bombardiro Crocodilo! ✈️🐊',
    evolvedCatchphrase: 'SUPREME Bombardiro Crocodilo! ✈️🐊💎'
  },
  {
    id: 'tungtung',
    name: 'Spoon Creature',
    italianName: 'Tung Tung Tung Sahur',
    description: 'A mysterious being made of kitchen utensils',
    emoji: '🥄',
    evolvedEmoji: '🥄⭐',
    image: 'https://i.imgur.com/UMhNxJP.png',
    evolvedImage: 'https://i.imgur.com/VNhOyKQ.png',
    color: '#c0c0c0',
    catchphrase: 'Tung Tung Tung! 🥄✨',
    evolvedCatchphrase: 'GOLDEN Tung Tung Tung! 🥄⭐✨'
  },
  {
    id: 'brrpatapim',
    name: 'Cold Bird',
    italianName: 'Brr Brr Patapim',
    description: 'A shivering bird creature from the frozen lands',
    emoji: '🐦',
    evolvedEmoji: '🐦❄️',
    image: 'https://i.imgur.com/WOhPzLR.png',
    evolvedImage: 'https://i.imgur.com/XPhQAMS.png',
    color: '#87ceeb',
    catchphrase: 'Brr Brr Patapim! 🥶🐦',
    evolvedCatchphrase: 'FROZEN Brr Brr Patapim! ❄️🐦💎'
  },
  {
    id: 'lirili',
    name: 'Cat Fish',
    italianName: 'Lirili Larila',
    description: 'A cat that became one with the sea',
    emoji: '🐱',
    evolvedEmoji: '🐱🔱',
    image: 'https://i.imgur.com/YQhRBNT.png',
    evolvedImage: 'https://i.imgur.com/ZRhSCOU.png',
    color: '#ff9f43',
    catchphrase: 'Lirili Larila! 🐱🐟',
    evolvedCatchphrase: 'OCEAN LORD Lirili Larila! 🐱🔱🐟'
  },
  {
    id: 'capuchino',
    name: 'Coffee Monkey',
    italianName: 'Capuchino Assassino',
    description: 'A caffeinated primate of mysterious origins',
    emoji: '🐵',
    evolvedEmoji: '🐵☕',
    image: 'https://i.imgur.com/AShTDPV.png',
    evolvedImage: 'https://i.imgur.com/BThUEQW.png',
    color: '#6f4e37',
    catchphrase: 'Capuchino Assassino! ☕🐵',
    evolvedCatchphrase: 'ESPRESSO LORD Capuchino! ☕🐵👑'
  },
  {
    id: 'bombombini',
    name: 'Explosive Penguin',
    italianName: 'Bombombini Gusini',
    description: 'A penguin with explosive personality',
    emoji: '🐧',
    evolvedEmoji: '🐧💥',
    image: 'https://i.imgur.com/CUhVFRX.png',
    evolvedImage: 'https://i.imgur.com/DVhWGSY.png',
    color: '#1a1a2e',
    catchphrase: 'Bombombini Gusini! 💥🐧',
    evolvedCatchphrase: 'NUCLEAR Bombombini Gusini! 💥🐧☢️'
  },
  {
    id: 'trippatroppa',
    name: 'Dancing Elephant',
    italianName: 'Trippa Troppa Truppa',
    description: 'An elephant that never stops dancing',
    emoji: '🐘',
    evolvedEmoji: '🐘🌟',
    image: 'https://i.imgur.com/EWhXHTZ.png',
    evolvedImage: 'https://i.imgur.com/FXhYIUA.png',
    color: '#9e9e9e',
    catchphrase: 'Trippa Troppa Truppa! 💃🐘',
    evolvedCatchphrase: 'DISCO KING Trippa Troppa Truppa! 💃🐘🌟'
  }
];

/**
 * Calculates the XP required to reach the next level.
 * Uses exponential growth formula: 100 * 1.15^(level-1)
 * 
 * @param level - The current level (1-based)
 * @returns The XP required to level up from this level
 * 
 * Examples:
 * - Level 1: 100 XP
 * - Level 10: ~351 XP
 * - Level 50: ~1,083 XP
 * - Level 100: ~117,391 XP
 */
export const getXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

/**
 * Calculates coins awarded when reaching a level.
 * Formula: 10 + (level * 2)
 * 
 * @param level - The level being reached
 * @returns The number of coins awarded
 */
export const getCoinsForLevel = (level: number): number => {
  return 10 + Math.floor(level * 2);
};

// Evolution level requirement
export const EVOLUTION_LEVEL = 100;

// Available upgrades
export const UPGRADES: Upgrade[] = [
  {
    id: 'autoFeeder',
    name: 'Auto Feeder',
    description: 'Automatically feeds your pet every minute',
    icon: '🍕',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 5, // +5 hunger per minute per level
  },
  {
    id: 'autoPlayer',
    name: 'Auto Player',
    description: 'Automatically plays with your pet every minute',
    icon: '🎮',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 5, // +5 happiness per minute per level
  },
  {
    id: 'autoRest',
    name: 'Comfy Bed',
    description: 'Automatically restores energy every minute',
    icon: '🛏️',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 5, // +5 energy per minute per level
  },
  {
    id: 'autoCleaner',
    name: 'Auto Cleaner',
    description: 'Automatically cleans your pet every minute',
    icon: '🧼',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 5, // +5 hygiene per minute per level
  },
  {
    id: 'clickPower',
    name: 'Click Power',
    description: 'Increases stat gain from actions',
    icon: '💪',
    baseCost: 100,
    costMultiplier: 2,
    maxLevel: 20,
    effect: 10, // +10% stat gain per level
  },
  {
    id: 'xpBoost',
    name: 'XP Boost',
    description: 'Increases XP gained from actions',
    icon: '⭐',
    baseCost: 150,
    costMultiplier: 2,
    maxLevel: 15,
    effect: 15, // +15% XP per level
  },
  {
    id: 'coinBoost',
    name: 'Coin Boost',
    description: 'Increases coins earned on level up',
    icon: '💰',
    baseCost: 200,
    costMultiplier: 2,
    maxLevel: 10,
    effect: 20, // +20% coins per level
  },
];

export const getUpgradeCost = (upgrade: Upgrade, currentLevel: number): number => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
};

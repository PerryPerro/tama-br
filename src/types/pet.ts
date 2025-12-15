export interface PetStats {
  hunger: number;      // 0-100, lower is hungrier
  happiness: number;   // 0-100, higher is happier
  energy: number;      // 0-100, lower is more tired
  hygiene: number;     // 0-100, lower is dirtier
}

export interface Attributes {
  speed: number;       // Gained from Play
  wisdom: number;      // Gained from Sleep
  strength: number;    // Gained from Eat (Feed)
  clarity: number;     // Gained from Clean
}

export type AreaType = 'scrapyard' | 'forest' | 'mountain' | 'ocean';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  icon: string;
  slot: EquipmentSlot;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  bonuses: {
    speed?: number;
    wisdom?: number;
    strength?: number;
    clarity?: number;
    attackPower?: number;
    defense?: number;
  };
}

export interface Area {
  id: string;
  name: string;
  type: AreaType;
  description: string;
  icon: string;
  attributeWeakness: keyof Attributes;  // Which attribute monsters are weak against
  requiredLevel: number;
  difficulty: number;  // 1-10, affects rewards
  unlockRequirement?: { areaId: string; levelRequired: number };
}

export interface MinigameResult {
  success: boolean;
  wavesCompleted: number;
  totalWaves: number;
  rewards?: {
    xp: number;
    coins: number;
    equipment?: Equipment;
  };
}

export interface EquippedItems {
  weapon?: Equipment;
  armor?: Equipment;
  accessory?: Equipment;
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

export type UpgradeId = 'autoCaretaker' | 'clickPower' | 'xpBoost' | 'coinBoost';

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
  attributes: Attributes;
  mood: PetMood;
  age: number;         // in minutes
  isAlive: boolean;
  lastUpdated: number; // timestamp
  xp: number;
  level: number;
  coins: number;
  totalClicks: number;
  evolutionCount: number;  // Number of times evolved (every 100 levels)
  upgrades: OwnedUpgrade[];
  inventory: Equipment[];
  equipped: EquippedItems;
  unlockedAreas: string[];  // Array of unlocked area IDs
  areaProgress: Record<string, number>;  // Area ID -> highest level completed
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
 * Uses a gentler scaling formula: 50 + (level * 10)
 * This makes leveling faster and more accessible.
 * 
 * @param level - The current level (1-based)
 * @returns The XP required to level up from this level
 * 
 * Examples:
 * - Level 1: 60 XP
 * - Level 10: 150 XP
 * - Level 50: 550 XP
 * - Level 100: 1050 XP
 */
export const getXpForLevel = (level: number): number => {
  return 50 + (level * 10);
};

/**
 * Calculates the base XP gain per action, which increases with level.
 * Formula: 10 + (level * 0.5)
 * 
 * @param level - The current level
 * @returns Base XP gain
 */
export const getBaseXpForAction = (level: number): number => {
  return Math.floor(10 + (level * 0.5));
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

// Evolution happens every 100 levels (no cap)
export const EVOLUTION_INTERVAL = 100;

// Auto-caretaker configuration
export const AUTO_CARETAKER_INTERVAL = 10000; // 10 seconds
export const AUTO_CARETAKER_STAT_BOOST = 10;  // +10 to ALL stats every tick

// Available areas for minigames
export const AREAS: Area[] = [
  // Scrapyard areas (Clarity weakness)
  {
    id: 'scrapyard_1',
    name: 'Scrapyard',
    type: 'scrapyard',
    description: 'A junkyard filled with rusty robots',
    icon: '🤖',
    attributeWeakness: 'clarity',
    requiredLevel: 1,
    difficulty: 1,
  },
  {
    id: 'scrapyard_2',
    name: 'Robot Factory',
    type: 'scrapyard',
    description: 'An abandoned factory with malfunctioning machines',
    icon: '🏭',
    attributeWeakness: 'clarity',
    requiredLevel: 10,
    difficulty: 3,
    unlockRequirement: { areaId: 'scrapyard_1', levelRequired: 5 },
  },
  {
    id: 'scrapyard_3',
    name: 'Cyber Wasteland',
    type: 'scrapyard',
    description: 'A desolate land of broken technology',
    icon: '💻',
    attributeWeakness: 'clarity',
    requiredLevel: 25,
    difficulty: 5,
    unlockRequirement: { areaId: 'scrapyard_1', levelRequired: 5 },
  },
  {
    id: 'scrapyard_4',
    name: 'AI Core',
    type: 'scrapyard',
    description: 'The heart of all machines',
    icon: '🧠',
    attributeWeakness: 'clarity',
    requiredLevel: 50,
    difficulty: 8,
    unlockRequirement: { areaId: 'scrapyard_1', levelRequired: 5 },
  },
  // Forest areas (Speed weakness)
  {
    id: 'forest_1',
    name: 'Enchanted Forest',
    type: 'forest',
    description: 'A mystical forest with swift creatures',
    icon: '🌲',
    attributeWeakness: 'speed',
    requiredLevel: 1,
    difficulty: 1,
  },
  {
    id: 'forest_2',
    name: 'Dark Woods',
    type: 'forest',
    description: 'A shadowy forest with agile predators',
    icon: '🌳',
    attributeWeakness: 'speed',
    requiredLevel: 10,
    difficulty: 3,
    unlockRequirement: { areaId: 'forest_1', levelRequired: 5 },
  },
  {
    id: 'forest_3',
    name: 'Ancient Grove',
    type: 'forest',
    description: 'An ancient forest with legendary beasts',
    icon: '🍃',
    attributeWeakness: 'speed',
    requiredLevel: 25,
    difficulty: 5,
    unlockRequirement: { areaId: 'forest_1', levelRequired: 5 },
  },
  {
    id: 'forest_4',
    name: 'World Tree',
    type: 'forest',
    description: 'The heart of all forests',
    icon: '🌴',
    attributeWeakness: 'speed',
    requiredLevel: 50,
    difficulty: 8,
    unlockRequirement: { areaId: 'forest_1', levelRequired: 5 },
  },
  // Mountain areas (Strength weakness)
  {
    id: 'mountain_1',
    name: 'Rocky Hills',
    type: 'mountain',
    description: 'Rocky terrain with tough monsters',
    icon: '⛰️',
    attributeWeakness: 'strength',
    requiredLevel: 1,
    difficulty: 1,
  },
  {
    id: 'mountain_2',
    name: 'Caverns',
    type: 'mountain',
    description: 'Deep caves with powerful creatures',
    icon: '🕳️',
    attributeWeakness: 'strength',
    requiredLevel: 10,
    difficulty: 3,
    unlockRequirement: { areaId: 'mountain_1', levelRequired: 5 },
  },
  {
    id: 'mountain_3',
    name: 'Frozen Peak',
    type: 'mountain',
    description: 'Icy mountains with fierce beasts',
    icon: '🏔️',
    attributeWeakness: 'strength',
    requiredLevel: 25,
    difficulty: 5,
    unlockRequirement: { areaId: 'mountain_1', levelRequired: 5 },
  },
  {
    id: 'mountain_4',
    name: 'Dragon\'s Lair',
    type: 'mountain',
    description: 'The ultimate challenge',
    icon: '🐲',
    attributeWeakness: 'strength',
    requiredLevel: 50,
    difficulty: 8,
    unlockRequirement: { areaId: 'mountain_1', levelRequired: 5 },
  },
  // Ocean areas (Wisdom weakness)
  {
    id: 'ocean_1',
    name: 'Shallow Waters',
    type: 'ocean',
    description: 'Calm waters with cunning fish',
    icon: '🌊',
    attributeWeakness: 'wisdom',
    requiredLevel: 1,
    difficulty: 1,
  },
  {
    id: 'ocean_2',
    name: 'Coral Reef',
    type: 'ocean',
    description: 'Colorful reef with tricky creatures',
    icon: '🐚',
    attributeWeakness: 'wisdom',
    requiredLevel: 10,
    difficulty: 3,
    unlockRequirement: { areaId: 'ocean_1', levelRequired: 5 },
  },
  {
    id: 'ocean_3',
    name: 'Deep Abyss',
    type: 'ocean',
    description: 'The dark depths of the ocean',
    icon: '🦑',
    attributeWeakness: 'wisdom',
    requiredLevel: 25,
    difficulty: 5,
    unlockRequirement: { areaId: 'ocean_1', levelRequired: 5 },
  },
  {
    id: 'ocean_4',
    name: 'Atlantis',
    type: 'ocean',
    description: 'The legendary underwater city',
    icon: '🔱',
    attributeWeakness: 'wisdom',
    requiredLevel: 50,
    difficulty: 8,
    unlockRequirement: { areaId: 'ocean_1', levelRequired: 5 },
  },
];

// Equipment pool for rewards
export const EQUIPMENT_POOL: Equipment[] = [
  // Common weapons
  { id: 'wooden_sword', name: 'Wooden Sword', description: 'A basic training sword', icon: '🗡️', slot: 'weapon', rarity: 'common', bonuses: { attackPower: 5 } },
  { id: 'iron_sword', name: 'Iron Sword', description: 'A sturdy iron blade', icon: '⚔️', slot: 'weapon', rarity: 'uncommon', bonuses: { attackPower: 10, strength: 2 } },
  { id: 'fiery_sword', name: 'Fiery Sword', description: 'A blade engulfed in flames', icon: '🔥', slot: 'weapon', rarity: 'rare', bonuses: { attackPower: 20, strength: 5 } },
  { id: 'lightning_blade', name: 'Lightning Blade', description: 'Crackling with electricity', icon: '⚡', slot: 'weapon', rarity: 'epic', bonuses: { attackPower: 35, speed: 10 } },
  { id: 'excalibur', name: 'Excalibur', description: 'The legendary sword of kings', icon: '👑', slot: 'weapon', rarity: 'legendary', bonuses: { attackPower: 50, strength: 15, clarity: 10 } },
  // Common armor
  { id: 'leather_armor', name: 'Leather Armor', description: 'Basic protection', icon: '🥋', slot: 'armor', rarity: 'common', bonuses: { defense: 5 } },
  { id: 'chainmail', name: 'Chainmail', description: 'Linked metal rings', icon: '⛓️', slot: 'armor', rarity: 'uncommon', bonuses: { defense: 10, strength: 2 } },
  { id: 'golden_armor', name: 'Golden Armor', description: 'Gleaming protective gear', icon: '🛡️', slot: 'armor', rarity: 'rare', bonuses: { defense: 20, clarity: 5 } },
  { id: 'dragon_armor', name: 'Dragon Armor', description: 'Forged from dragon scales', icon: '🐉', slot: 'armor', rarity: 'epic', bonuses: { defense: 35, strength: 8, wisdom: 5 } },
  { id: 'cosmic_armor', name: 'Cosmic Armor', description: 'Armor from the stars', icon: '✨', slot: 'armor', rarity: 'legendary', bonuses: { defense: 50, speed: 10, wisdom: 10, clarity: 10 } },
  // Accessories
  { id: 'lucky_charm', name: 'Lucky Charm', description: 'Brings good fortune', icon: '🍀', slot: 'accessory', rarity: 'common', bonuses: { speed: 3 } },
  { id: 'wisdom_ring', name: 'Wisdom Ring', description: 'Enhances mental clarity', icon: '💍', slot: 'accessory', rarity: 'uncommon', bonuses: { wisdom: 8, clarity: 4 } },
  { id: 'power_amulet', name: 'Power Amulet', description: 'Amplifies your strength', icon: '📿', slot: 'accessory', rarity: 'rare', bonuses: { strength: 12, attackPower: 8 } },
  { id: 'speed_boots', name: 'Speed Boots', description: 'Move like the wind', icon: '👟', slot: 'accessory', rarity: 'epic', bonuses: { speed: 20, attackPower: 5 } },
  { id: 'crown_champions', name: 'Crown of Champions', description: 'The ultimate prize', icon: '👑', slot: 'accessory', rarity: 'legendary', bonuses: { speed: 15, wisdom: 15, strength: 15, clarity: 15 } },
];

// Available upgrades
export const UPGRADES: Upgrade[] = [
  {
    id: 'autoCaretaker',
    name: 'Auto Caretaker',
    description: 'Automatically boosts ALL stats (+10 each) every 10 seconds',
    icon: '🤖',
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 10, // +10 to all stats per 10 seconds per level
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

// Helper to check if pet should evolve (every 100 levels)
export const getEvolutionCount = (level: number): number => {
  return Math.floor(level / EVOLUTION_INTERVAL);
};

// Get evolution title based on evolution count
export const getEvolutionTitle = (evolutionCount: number): string => {
  const titles = ['', 'Evolved', 'Mega', 'Ultra', 'Supreme', 'Legendary', 'Mythic', 'Cosmic', 'Divine', 'Eternal'];
  return titles[Math.min(evolutionCount, titles.length - 1)] || `Ascended x${evolutionCount}`;
};

// Get random equipment based on area difficulty
export const getRandomEquipment = (difficulty: number): Equipment | undefined => {
  const rarityChances: Record<Equipment['rarity'], number> = {
    common: 50 + Math.max(0, 30 - difficulty * 5),
    uncommon: 30,
    rare: 15 + difficulty,
    epic: 4 + difficulty,
    legendary: 1 + Math.floor(difficulty / 3),
  };
  
  const totalChance = Object.values(rarityChances).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalChance;
  let selectedRarity: Equipment['rarity'] = 'common';
  
  for (const [rarity, chance] of Object.entries(rarityChances)) {
    roll -= chance;
    if (roll <= 0) {
      selectedRarity = rarity as Equipment['rarity'];
      break;
    }
  }
  
  const rarityPool = EQUIPMENT_POOL.filter(e => e.rarity === selectedRarity);
  if (rarityPool.length === 0) return undefined;
  
  return rarityPool[Math.floor(Math.random() * rarityPool.length)];
};

// Get total attribute bonuses from equipped items
export const getEquipmentBonuses = (equipped: EquippedItems): Partial<Attributes> & { attackPower?: number; defense?: number } => {
  const bonuses: Partial<Attributes> & { attackPower?: number; defense?: number } = {};
  
  const items = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean);
  
  for (const item of items) {
    if (item?.bonuses) {
      for (const [key, value] of Object.entries(item.bonuses)) {
        if (value !== undefined) {
          bonuses[key as keyof typeof bonuses] = (bonuses[key as keyof typeof bonuses] || 0) + value;
        }
      }
    }
  }
  
  return bonuses;
};

// Check if an area is unlocked for a pet
export const isAreaUnlocked = (area: Area, pet: Pet): boolean => {
  // Starter areas are always unlocked
  if (!area.unlockRequirement) return true;
  
  // Check if the pet has reached the required progress in the prerequisite area
  const { areaId, levelRequired } = area.unlockRequirement;
  const progress = pet.areaProgress[areaId] || 0;
  return progress >= levelRequired;
};

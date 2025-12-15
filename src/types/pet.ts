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
  color: string;
  catchphrase: string;
}

export interface Pet {
  character: BrainRotCharacter;
  stats: PetStats;
  mood: PetMood;
  age: number;         // in minutes
  isAlive: boolean;
  lastUpdated: number; // timestamp
}

export const BRAIN_ROT_CHARACTERS: BrainRotCharacter[] = [
  {
    id: 'tralalero',
    name: 'Shark with Legs',
    italianName: 'Tralalero Tralala',
    description: 'A majestic shark that evolved legs and walks on land',
    emoji: '🦈',
    color: '#4a90d9',
    catchphrase: 'Tralalero Tralala! 🦈🦵'
  },
  {
    id: 'bombardiro',
    name: 'Bomber Crocodile',
    italianName: 'Bombardiro Crocodilo',
    description: 'A crocodile merged with a plane, ready for takeoff',
    emoji: '🐊',
    color: '#2d5a27',
    catchphrase: 'Bombardiro Crocodilo! ✈️🐊'
  },
  {
    id: 'tungtung',
    name: 'Spoon Creature',
    italianName: 'Tung Tung Tung Sahur',
    description: 'A mysterious being made of kitchen utensils',
    emoji: '🥄',
    color: '#c0c0c0',
    catchphrase: 'Tung Tung Tung! 🥄✨'
  },
  {
    id: 'brrpatapim',
    name: 'Cold Bird',
    italianName: 'Brr Brr Patapim',
    description: 'A shivering bird creature from the frozen lands',
    emoji: '🐦',
    color: '#87ceeb',
    catchphrase: 'Brr Brr Patapim! 🥶🐦'
  },
  {
    id: 'lirili',
    name: 'Cat Fish',
    italianName: 'Lirili Larila',
    description: 'A cat that became one with the sea',
    emoji: '🐱',
    color: '#ff9f43',
    catchphrase: 'Lirili Larila! 🐱🐟'
  },
  {
    id: 'capuchino',
    name: 'Coffee Monkey',
    italianName: 'Capuchino Assassino',
    description: 'A caffeinated primate of mysterious origins',
    emoji: '🐵',
    color: '#6f4e37',
    catchphrase: 'Capuchino Assassino! ☕🐵'
  },
  {
    id: 'bombombini',
    name: 'Explosive Penguin',
    italianName: 'Bombombini Gusini',
    description: 'A penguin with explosive personality',
    emoji: '🐧',
    color: '#1a1a2e',
    catchphrase: 'Bombombini Gusini! 💥🐧'
  },
  {
    id: 'trippatroppa',
    name: 'Dancing Elephant',
    italianName: 'Trippa Troppa Truppa',
    description: 'An elephant that never stops dancing',
    emoji: '🐘',
    color: '#9e9e9e',
    catchphrase: 'Trippa Troppa Truppa! 💃🐘'
  }
];

import { spriteManager } from './sprites';

// Initialize placeholder sprites with different colors
export async function initializePlaceholderSprites(): Promise<void> {
  // Player sprites
  spriteManager.createPlaceholderSprite('player', '#4CAF50', 32, 32);
  
  // Try to load real sprites first
  await loadRealSprites();
  
  // Enemy types with different colors
  spriteManager.createPlaceholderSprite('enemy-basic', '#FF5252', 28, 28);
  spriteManager.createPlaceholderSprite('enemy-elite', '#9C27B0', 36, 36);
  spriteManager.createPlaceholderSprite('enemy-boss', '#FF9800', 48, 48);
  
  // Area-specific enemies
  spriteManager.createPlaceholderSprite('enemy-robot', '#00BCD4', 28, 28);
  spriteManager.createPlaceholderSprite('enemy-forest', '#4CAF50', 28, 28);
  spriteManager.createPlaceholderSprite('enemy-mountain', '#795548', 28, 28);
  
  // Projectiles
  spriteManager.createPlaceholderSprite('projectile-waterball', '#2196F3', 16, 16);
  spriteManager.createPlaceholderSprite('projectile-banana', '#FFEB3B', 16, 16);
  spriteManager.createPlaceholderSprite('projectile-acorn', '#8D6E63', 16, 16);
  spriteManager.createPlaceholderSprite('projectile-boomerang', '#FF5722', 16, 16);
  
  // Particles
  spriteManager.createPlaceholderSprite('particle-hit', '#FFD700', 8, 8);
  spriteManager.createPlaceholderSprite('particle-xp', '#00E676', 12, 12);
  
  // Setup animations - use single frame since sprites are static images
  spriteManager.addAnimation('walk', [0], 150, true);
  spriteManager.addAnimation('idle', [0], 1000, true);
  spriteManager.addAnimation('attack', [0], 100, false);
}

// Load real sprite sheets
export async function loadRealSprites(): Promise<void> {
  try {
    // Load character sprites
    await spriteManager.loadSpriteSheet('player-tralalero', '/sprites/tralalero.png', 16, 16);
    await spriteManager.loadSpriteSheet('player-bombardiro', '/sprites/crocodilo.png', 16, 16);
    await spriteManager.loadSpriteSheet('player-capuchino', '/sprites/bananini.png', 16, 16);
    
    // Load enemy sprites
    await spriteManager.loadSpriteSheet('enemy-rogue', '/sprites/roguelikeChar_transparent.png', 16, 16);
    await spriteManager.loadSpriteSheet('enemy-rogue-elite', '/sprites/roguelikeChar_magenta.png', 16, 16);
    
    console.log('Real sprites loaded successfully!');
  } catch (error) {
    console.error('Failed to load sprites:', error);
    console.log('Falling back to placeholder sprites');
  }
}

// Get the correct sprite name for a character ID
export function getCharacterSpriteName(characterId: string): string {
  const spriteMap: Record<string, string> = {
    'tralalero': 'player-tralalero',
    'bombardiro': 'player-bombardiro',
    'capuchino': 'player-capuchino',
    'bombombini': 'player',  // Fallback to placeholder
    'brrpatapim': 'player',  // Fallback to placeholder
    'tungtung': 'player',    // Fallback to placeholder
    'lirili': 'player',      // Fallback to placeholder
    'trippatroppa': 'player' // Fallback to placeholder
  };
  
  return spriteMap[characterId] || 'player';
}

# Adding Sprite Sheets to the Minigame

## Quick Start

The game now uses a sprite-based rendering system! Currently using colored placeholder sprites, but you can easily add real pixel art.

## Where to Get Sprites

### Free Pixel Art Resources:
1. **itch.io** - https://itch.io/game-assets/free/tag-sprites
   - Search for "top-down" or "2d sprites"
   - Look for 32x32 or 64x64 sprite sheets
   
2. **OpenGameArt.org** - https://opengameart.org/
   - Filter by "Sprites & Tiles"
   - License: CC0 or CC-BY

3. **Kenney.nl** - https://kenney.nl/assets?q=2d
   - All assets are CC0 (public domain)
   - High quality, consistent style

### Recommended Packs:
- **Tiny Dungeon** by Kenney (characters & enemies)
- **Micro Roguelike** by Kenney (various sprites)
- **LPC Character Base** (customizable characters)

## Sprite Sheet Format

Your sprite sheets should be:
- **PNG format**
- **Transparent background**
- **Organized in a grid** (frames left-to-right, animations top-to-bottom)
- **Consistent frame size** (e.g., all 32x32 pixels)

Example sprite sheet layout:
```
Row 0: Idle animation (4 frames)
Row 1: Walk animation (4 frames)
Row 2: Attack animation (4 frames)
```

## How to Add Sprites

### 1. Add sprite files to public folder:
```
public/
  sprites/
    player.png
    enemy-basic.png
    enemy-elite.png
    projectiles.png
```

### 2. Update spriteLoader.ts:
```typescript
export async function loadRealSprites(): Promise<void> {
  await spriteManager.loadSpriteSheet('player', '/sprites/player.png', 32, 32);
  await spriteManager.loadSpriteSheet('enemy-basic', '/sprites/enemy.png', 32, 32);
  await spriteManager.loadSpriteSheet('projectile-waterball', '/sprites/projectiles.png', 16, 16);
  // etc...
}
```

### 3. Define animations:
```typescript
// In spriteLoader.ts after loading
spriteManager.addAnimation('walk', [0, 1, 2, 3], 150, true);
spriteManager.addAnimation('attack', [4, 5, 6, 7], 100, false);
```

## Example: Creating a Simple Sprite

If you want to create your own:
1. Use **Aseprite** (paid) or **Piskel** (free online)
2. Create 32x32 canvas
3. Draw your character/enemy
4. Create 4 frames for walking animation
5. Export as PNG sprite sheet

## Current Placeholder Sprites

The game uses colored circles with eyes as placeholders:
- Green = Player
- Red = Basic enemy
- Purple = Elite enemy
- Orange = Boss
- Blue = Projectiles

These will be automatically replaced when you load real sprites!

## Testing

After adding sprites, the game will automatically use them. Check the browser console for any loading errors.

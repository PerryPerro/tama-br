export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  loaded: boolean;
}

export interface Animation {
  frames: number[];
  frameTime: number; // ms per frame
  loop: boolean;
}

export class SpriteManager {
  private sheets: Map<string, SpriteSheet> = new Map();
  private animations: Map<string, Animation> = new Map();

  loadSpriteSheet(
    name: string,
    imagePath: string,
    frameWidth: number,
    frameHeight: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.sheets.set(name, {
          image: img,
          frameWidth,
          frameHeight,
          loaded: true,
        });
        resolve();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  // Create a colored placeholder sprite (for when assets aren't loaded)
  createPlaceholderSprite(name: string, color: string, width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple creature shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(width * 0.4, height * 0.4, width * 0.1, 0, Math.PI * 2);
    ctx.arc(width * 0.6, height * 0.4, width * 0.1, 0, Math.PI * 2);
    ctx.fill();

    const img = new Image();
    img.src = canvas.toDataURL();
    this.sheets.set(name, {
      image: img,
      frameWidth: width,
      frameHeight: height,
      loaded: true,
    });
  }

  addAnimation(name: string, frames: number[], frameTime: number, loop: boolean = true): void {
    this.animations.set(name, { frames, frameTime, loop });
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    x: number,
    y: number,
    frame: number = 0,
    scale: number = 1,
    rotation: number = 0
  ): void {
    const sheet = this.sheets.get(spriteName);
    if (!sheet || !sheet.loaded || !sheet.image.complete) {
      // Draw a fallback colored circle if sprite not loaded
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const cols = Math.floor(sheet.image.width / sheet.frameWidth);
    const frameX = (frame % cols) * sheet.frameWidth;
    const frameY = Math.floor(frame / cols) * sheet.frameHeight;

    ctx.drawImage(
      sheet.image,
      frameX,
      frameY,
      sheet.frameWidth,
      sheet.frameHeight,
      -sheet.frameWidth * scale / 2,
      -sheet.frameHeight * scale / 2,
      sheet.frameWidth * scale,
      sheet.frameHeight * scale
    );

    ctx.restore();
  }

  getAnimationFrame(animName: string, elapsedTime: number): number {
    const anim = this.animations.get(animName);
    if (!anim) return 0;

    const frameIndex = Math.floor(elapsedTime / anim.frameTime) % anim.frames.length;
    return anim.frames[frameIndex];
  }

  isLoaded(name: string): boolean {
    return this.sheets.get(name)?.loaded ?? false;
  }
}

// Global sprite manager instance
export const spriteManager = new SpriteManager();

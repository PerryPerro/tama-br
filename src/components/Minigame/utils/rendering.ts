import type { Particle } from '../types';

export function createHitParticles(
  x: number,
  y: number,
  color: string = '#FFD700'
): Particle[] {
  return Array.from({ length: 8 }, () => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    life: 1,
    color,
  }));
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 20
): void {
  ctx.strokeStyle = '#16213e33';
  ctx.lineWidth = 1;
  
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 5, width / 2, height / 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  damage: number;
  life: number;
  vx: number;
  vy: number;
  isCritical: boolean;
}

export interface EnhancedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'circle' | 'square' | 'triangle' | 'spark';
  rotation?: number;
  rotationSpeed?: number;
}

export function createBloodSplatter(x: number, y: number): EnhancedParticle[] {
  const particles: EnhancedParticle[] = [];
  const count = 12;
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 3;
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Slight upward bias
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      color: '#FF0000',
      type: 'circle',
    });
  }
  
  return particles;
}

export function createExplosion(x: number, y: number, color: string): EnhancedParticle[] {
  const particles: EnhancedParticle[] = [];
  const count = 20;
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 3 + Math.random() * 4;
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 3 + Math.random() * 4,
      color,
      type: Math.random() > 0.5 ? 'square' : 'spark',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  
  return particles;
}

export function createXPGem(x: number, y: number): EnhancedParticle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: -2 - Math.random() * 2,
    life: 1,
    maxLife: 1,
    size: 8,
    color: '#00E676',
    type: 'circle',
  };
}

export function createDamageNumber(
  x: number,
  y: number,
  damage: number,
  isCritical: boolean = false
): DamageNumber {
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    damage,
    life: 1,
    vx: (Math.random() - 0.5) * 2,
    vy: -3,
    isCritical,
  };
}

export function updateParticles(particles: EnhancedParticle[]): EnhancedParticle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // Gravity
      life: p.life - 0.02,
      rotation: p.rotation !== undefined ? p.rotation + (p.rotationSpeed || 0) : undefined,
    }))
    .filter(p => p.life > 0);
}

export function updateDamageNumbers(numbers: DamageNumber[]): DamageNumber[] {
  return numbers
    .map(n => ({
      ...n,
      x: n.x + n.vx,
      y: n.y + n.vy,
      life: n.life - 0.015,
    }))
    .filter(n => n.life > 0);
}

export function drawEnhancedParticle(ctx: CanvasRenderingContext2D, p: EnhancedParticle): void {
  ctx.save();
  ctx.globalAlpha = p.life;
  ctx.fillStyle = p.color;
  
  ctx.translate(p.x, p.y);
  if (p.rotation !== undefined) {
    ctx.rotate(p.rotation);
  }
  
  switch (p.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'square':
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      break;
      
    case 'spark':
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.3, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      break;
  }
  
  ctx.restore();
}

export function drawDamageNumber(ctx: CanvasRenderingContext2D, n: DamageNumber): void {
  ctx.save();
  ctx.globalAlpha = n.life;
  ctx.font = n.isCritical ? 'bold 20px Arial' : 'bold 14px Arial';
  ctx.fillStyle = n.isCritical ? '#FF0000' : '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const text = n.damage.toString();
  ctx.strokeText(text, n.x, n.y);
  ctx.fillText(text, n.x, n.y);
  
  ctx.restore();
}

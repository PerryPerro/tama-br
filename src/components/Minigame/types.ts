import type { Pet, Area } from '../../types/pet';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type SpawnSide = 'top' | 'left' | 'right';
export type ProjectileType = 'waterball' | 'banana' | 'acorn' | 'boomerang' | 'default';
export type GameState = 'ready' | 'playing' | 'finished';

export interface Monster {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  spawnSide: SpawnSide;
  isBoss?: boolean;
  isMinion?: boolean;
  requiresCharged?: boolean;
  dotDamage?: number;
  dotTimer?: number;
  isElite?: boolean;
  walkFrame?: number;
  speedMultiplier?: number;
}

export interface BossState {
  shieldHits: number;
  isVulnerable: boolean;
  vulnerableTimer: number;
  chargedHitsReceived: number;
  minionsSpawned: boolean;
  phase: number;
  hasSpawnedWave: boolean;
}

export interface Player {
  x: number;
  y: number;
  facing: Direction;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
  isReturning?: boolean;
  icon: string;
  piercing: boolean;
  hitMonsters?: Set<number>;
  explosionRadius?: number;
  type: ProjectileType;
  // Waterball (Crocodilo) properties
  dotDamage?: number;
  dotDuration?: number;
  splashRadius?: number;
  // Banana (Capuchino) properties
  splitCount?: number;
  hasSplit?: boolean;
  // Acorn (Brr Brr Patapim) properties
  bounceCount?: number;
  maxBounces?: number;
  // Boomerang (Bombombini) properties
  arcProgress?: number;
  returnSpeed?: number;
}

export interface MinigameProps {
  pet: Pet;
  area: Area;
  onComplete: (result: any) => void;
  onClose: () => void;
}

export interface GameRefs {
  keysPressed: React.MutableRefObject<Set<string>>;
  gameLoopRef: React.MutableRefObject<number | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderLoopRef: React.MutableRefObject<number | null>;
  projectilesRef: React.MutableRefObject<Projectile[]>;
  lastAutoAttackTime: React.MutableRefObject<number>;
  aimAngleRef: React.MutableRefObject<number>;
  targetAimAngleRef: React.MutableRefObject<number>;
  playerRef: React.MutableRefObject<Player>;
  monstersRef: React.MutableRefObject<Monster[]>;
  chargeStartTime: React.MutableRefObject<number | null>;
  chargeIntervalRef: React.MutableRefObject<number | null>;
  bossStateRef: React.MutableRefObject<BossState>;
  lastSpawnTime: React.MutableRefObject<number>;
  elapsedTime: React.MutableRefObject<number>;
}

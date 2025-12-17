import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet, Area, Equipment, MinigameResult, Attributes } from '../types/pet';
import { getRandomEquipment, getEquipmentBonuses } from '../types/pet';
import './Minigame.css';
import { spriteManager } from './Minigame/utils/sprites';
import { initializePlaceholderSprites, getCharacterSpriteName } from './Minigame/utils/spriteLoader';
import { 
  updateParticles as updateEnhancedParticles,
  createDamageNumber,
  drawDamageNumber,
  type EnhancedParticle,
  type DamageNumber
} from './Minigame/utils/effects';

interface MinigameProps {
  pet: Pet;
  area: Area;
  onComplete: (result: MinigameResult) => void;
  onClose: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type SpawnSide = 'top' | 'left' | 'right';

interface Monster {
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

interface BossState {
  shieldHits: number;
  isVulnerable: boolean;
  vulnerableTimer: number;
  chargedHitsReceived: number;
  minionsSpawned: boolean;
  phase: number;
  hasSpawnedWave: boolean;
}

interface Player {
  x: number;
  y: number;
  facing: Direction;
}

const GAME_WIDTH = 1800;
const GAME_HEIGHT = 980;
const PLAYER_SIZE = 60;
const MONSTER_SIZE = 50;
const MOVE_SPEED = 2;
const GAME_DURATION = 180; // 3 minutes total
const LEVEL_DURATION = 30; // 30 seconds per level
const MAX_LEVEL = 6; // 6 levels total
const BOSS_SIZE = 80;
const ROBOT_BOSS_SHIELD_HITS = 3;
const ROBOT_BOSS_VULNERABLE_TIME = 15000; // 5 seconds
const MOUNTAIN_BOSS_MINION_COUNT = 15;
const ATTACK_RANGE = 300; // Increased range for projectiles
const PROJECTILE_SPEED = 8;
const AUTO_ATTACK_COOLDOWN = 500; // Auto-attack every 0.5 seconds
const CHARGE_THRESHOLD = 500; // 0.5 seconds to start charging
const CHARGE_LEVEL_INTERVAL = 500; // 0.5 seconds per charge level
const MAX_CHARGE_LEVEL = 3; // Maximum 3x multiplier

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface GameRefs {
  enhancedParticles: EnhancedParticle[];
  damageNumbers: DamageNumber[];
  animationStartTime: number;
}

type ProjectileType = 'waterball' | 'banana' | 'acorn' | 'boomerang' | 'default';

interface Projectile {
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

export const Minigame = ({ pet, area, onComplete, onClose }: MinigameProps) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastSpawnTime = useRef<number>(0);
  const elapsedTime = useRef<number>(0);
  const [bossState, setBossState] = useState<BossState>({
    shieldHits: 0,
    isVulnerable: false,
    vulnerableTimer: 0,
    chargedHitsReceived: 0,
    minionsSpawned: false,
    phase: 0,
    hasSpawnedWave: false,
  });
  
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderLoopRef = useRef<number | null>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const lastAutoAttackTime = useRef<number>(0);
  
  // Enhanced particle system refs
  const gameRefs = useRef<GameRefs>({
    enhancedParticles: [],
    damageNumbers: [],
    animationStartTime: Date.now()
  });
  
  // Calculate attack cooldown based on speed attribute (lower is faster)
  // Base cooldown of 500ms, reduced by speed (e.g., 20 speed = 400ms)
  const equipBonuses = getEquipmentBonuses(pet.equipped);
  const speedValue = pet.attributes.speed + (equipBonuses.speed || 0);
  const attackCooldown = Math.max(200, AUTO_ATTACK_COOLDOWN - (speedValue * 5)); // Min 200ms
  
  // TODO: Implement wisdom for fatigue system (stamina/energy management)
  // TODO: Implement clarity for dodge chance from monster attacks
  const aimAngleRef = useRef<number>(0);
  const targetAimAngleRef = useRef<number>(0);
  const playerRef = useRef<Player>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, facing: 'up' });
  const monstersRef = useRef<Monster[]>([]);
  const chargeStartTime = useRef<number | null>(null);
  const chargeIntervalRef = useRef<number | null>(null);
  const bossStateRef = useRef<BossState>({
    shieldHits: 0,
    isVulnerable: false,
    vulnerableTimer: 0,
    chargedHitsReceived: 0,
    minionsSpawned: false,
    phase: 0,
    hasSpawnedWave: false,
  });

  // Calculate player's attack power based on attributes and equipment
  const getPlayerPower = useCallback(() => {
    const equipBonuses = getEquipmentBonuses(pet.equipped);
    const strengthValue = pet.attributes.strength + (equipBonuses.strength || 0);
    const weaknessAttr = area.attributeWeakness;
    const attrValue = pet.attributes[weaknessAttr] + (equipBonuses[weaknessAttr] || 0);
    // Base damage from strength, bonus from area weakness attribute
    const basePower = 8 + Math.floor(strengthValue / 3) + Math.floor(attrValue / 6);
    const attackBonus = equipBonuses.attackPower || 0;
    return basePower + attackBonus;
  }, [pet, area]);

  // Create particles on hit
  const createHitParticles = useCallback((x: number, y: number, color: string = '#FFD700') => {
    const newParticles: Particle[] = Array.from({ length: 8 }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color,
    }));
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Spawn minions for forest boss
  const spawnForestMinions = useCallback(() => {
    const newMonsters: Monster[] = [];
    for (let i = 0; i < 2; i++) {
      newMonsters.push({
        id: Date.now() + Math.random(),
        x: Math.random() * (GAME_WIDTH - MONSTER_SIZE),
        y: -MONSTER_SIZE,
        health: 30,
        maxHealth: 30,
        isAttacking: false,
        spawnSide: 'top',
        isMinion: true,
      });
    }
    monstersRef.current = [...monstersRef.current, ...newMonsters];
    setMonsters(monstersRef.current);
  }, []);

  // Spawn minion wave for mountain boss
  const spawnMountainWave = useCallback(() => {
    const newMonsters: Monster[] = [];
    for (let i = 0; i < MOUNTAIN_BOSS_MINION_COUNT; i++) {
      const side: SpawnSide = ['top', 'left', 'right'][i % 3] as SpawnSide;
      let x: number, y: number;
      
      switch (side) {
        case 'top':
          x = Math.random() * (GAME_WIDTH - MONSTER_SIZE);
          y = -MONSTER_SIZE;
          break;
        case 'left':
          x = -MONSTER_SIZE;
          y = Math.random() * (GAME_HEIGHT / 2);
          break;
        case 'right':
          x = GAME_WIDTH;
          y = Math.random() * (GAME_HEIGHT / 2);
          break;
      }
      
      newMonsters.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        health: 50,
        maxHealth: 50,
        isAttacking: false,
        spawnSide: side,
        isMinion: true,
        requiresCharged: true,
      });
    }
    monstersRef.current = [...monstersRef.current, ...newMonsters];
    setMonsters(monstersRef.current);
  }, []);

  // Spawn individual monster based on current level
  const spawnMonster = useCallback((currentLevel: number, forceElite: boolean = false) => {
    const sides: SpawnSide[] = ['top', 'left', 'right'];
    const side = sides[Math.floor(Math.random() * sides.length)];
    
    let x: number, y: number;
    
    switch (side) {
      case 'top':
        x = Math.random() * (GAME_WIDTH - MONSTER_SIZE);
        y = -MONSTER_SIZE;
        break;
      case 'left':
        x = -MONSTER_SIZE;
        y = Math.random() * (GAME_HEIGHT / 2);
        break;
      case 'right':
        x = GAME_WIDTH;
        y = Math.random() * (GAME_HEIGHT / 2);
        break;
    }
    
    // Determine if this is an elite (10% chance, or forced, or guaranteed at higher levels)
    const eliteChance = currentLevel >= 3 ? 0.15 : 0.10;
    const isElite = forceElite || Math.random() < eliteChance;
    
    // Scale health and speed with level
    const baseHealth = 20 + currentLevel * 8 + area.difficulty * 5;
    const health = isElite ? baseHealth * 3 : baseHealth;
    const speedMultiplier = isElite ? 2 : 1;
    
    const newMonster: Monster = {
      id: Date.now() + Math.random(),
      x,
      y,
      health,
      maxHealth: health,
      isAttacking: false,
      spawnSide: side,
      isElite,
      walkFrame: 0,
      speedMultiplier,
    };
    
    monstersRef.current = [...monstersRef.current, newMonster];
    setMonsters(monstersRef.current);
  }, [area.difficulty]);
  
  // Spawn boss at final level
  const spawnBoss = useCallback(() => {
    const bossHealth = area.icon === '🤖' || area.name.includes('Robot') 
      ? 250 + area.difficulty * 50 
      : 500 + area.difficulty * 100;
    
    const boss: Monster = {
      id: Date.now(),
      x: GAME_WIDTH / 2 - BOSS_SIZE / 2,
      y: 50,
      health: bossHealth,
      maxHealth: bossHealth,
      isAttacking: false,
      spawnSide: 'top',
      isBoss: true,
      walkFrame: 0,
    };
    
    // Reset boss state
    const initialBossState: BossState = {
      shieldHits: 0,
      isVulnerable: false,
      vulnerableTimer: 0,
      chargedHitsReceived: 0,
      minionsSpawned: false,
      phase: 0,
      hasSpawnedWave: false,
    };
    bossStateRef.current = initialBossState;
    setBossState(initialBossState);
    
    monstersRef.current = [...monstersRef.current, boss];
    setMonsters(monstersRef.current);
  }, [area.difficulty, area.icon, area.name]);

  // Get projectile type and icon based on character
  const getProjectileData = useCallback(() => {
    const charId = pet.character.id;
    
    switch (charId) {
      case 'bombardiro': // Crocodilo - Water ball
        return { type: 'waterball' as ProjectileType, icon: '💧' };
      case 'capuchino': // Coffee Monkey - Banana
        return { type: 'banana' as ProjectileType, icon: '🍌' };
      case 'brrpatapim': // Brr Brr Patapim - Acorn
        return { type: 'acorn' as ProjectileType, icon: '🌰' };
      case 'bombombini': // Explosive Penguino - Boomerang
        return { type: 'boomerang' as ProjectileType, icon: '🪃' };
      default:
        return { type: 'default' as ProjectileType, icon: '🪃' };
    }
  }, [pet.character.id]);

  // Shoot projectile toward aim direction
  const shootProjectile = useCallback((chargedLevel = 0) => {
    const currentPlayer = playerRef.current;
    const playerCenterX = currentPlayer.x + PLAYER_SIZE / 2;
    const playerCenterY = currentPlayer.y + PLAYER_SIZE / 2;
    
    const angle = aimAngleRef.current;
    const speed = PROJECTILE_SPEED;
    const basePower = getPlayerPower();
    const { type, icon } = getProjectileData();
    
    // Auto-attacks = 1x, Charge level 1 = 2x, level 2 = 3x, level 3 = 4x
    const chargeMultiplier = chargedLevel === 0 ? 1 : chargedLevel + 1;
    let damage = Math.floor(basePower * chargeMultiplier);
    const maxDistance = ATTACK_RANGE * (chargedLevel === 0 ? 1 : chargeMultiplier * 0.7);
    const isPiercing = chargedLevel >= 1; // All charged attacks pierce
    const explosionRadius = chargedLevel >= 1 ? 30 + (chargedLevel * 15) : 0;
    
    // Banana deals 15% less damage but explodes
    if (type === 'banana') {
      damage = Math.floor(damage * 0.85);
    }
    
    const newProjectile: Projectile = {
      id: Date.now() + Math.random(),
      x: playerCenterX,
      y: playerCenterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      damage: damage,
      distanceTraveled: 0,
      maxDistance: maxDistance,
      icon: icon,
      piercing: isPiercing,
      hitMonsters: new Set(),
      explosionRadius: explosionRadius,
      type: type,
      // Type-specific properties
      dotDamage: type === 'waterball' ? Math.floor(damage * 0.2) : undefined,
      dotDuration: type === 'waterball' ? 3000 : undefined,
      splashRadius: type === 'waterball' ? 40 : undefined,
      splitCount: type === 'banana' ? 5 : undefined,
      hasSplit: false,
      bounceCount: 0,
      maxBounces: type === 'acorn' ? 3 : 0,
      arcProgress: type === 'boomerang' ? 0 : undefined,
      returnSpeed: type === 'boomerang' ? speed * 0.8 : undefined,
    };
    
    projectilesRef.current = [...projectilesRef.current, newProjectile];
  }, [getPlayerPower, getProjectileData]);

  // Start tracking space key press - pauses auto-attacks
  const startCharging = useCallback(() => {
    chargeStartTime.current = Date.now();
    setIsCharging(true);
    setChargeLevel(0);
    
    // Update charge level every 50ms for smooth visual feedback
    chargeIntervalRef.current = window.setInterval(() => {
      if (chargeStartTime.current) {
        const elapsed = Date.now() - chargeStartTime.current;
        
        // Calculate charge level based on elapsed time
        if (elapsed >= CHARGE_THRESHOLD) {
          // Calculate charge level: 0.5s = level 1, 1.0s = level 2, 1.5s = level 3
          const chargeTime = elapsed - CHARGE_THRESHOLD;
          const newLevel = Math.min(Math.floor(chargeTime / CHARGE_LEVEL_INTERVAL) + 1, MAX_CHARGE_LEVEL);
          setChargeLevel(newLevel);
        } else {
          // Still charging but below threshold
          setChargeLevel(0);
        }
      }
    }, 50);
  }, []);

  // Release charged attack - shoots powerful projectile
  const releaseCharge = useCallback(() => {
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    
    if (chargeStartTime.current) {
      const elapsed = Date.now() - chargeStartTime.current;
      
      // Only shoot if charged long enough
      if (elapsed >= CHARGE_THRESHOLD) {
        const chargeTime = elapsed - CHARGE_THRESHOLD;
        const finalLevel = Math.min(Math.floor(chargeTime / CHARGE_LEVEL_INTERVAL) + 1, MAX_CHARGE_LEVEL);
        shootProjectile(finalLevel);
      }
    }
    
    chargeStartTime.current = null;
    setIsCharging(false);
    setChargeLevel(0);
  }, [shootProjectile]);

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw grid pattern
    ctx.strokeStyle = '#16213e33';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw player
    const currentPlayer = playerRef.current;
    
    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(
      currentPlayer.x + PLAYER_SIZE/2,
      currentPlayer.y + PLAYER_SIZE + 5,
      PLAYER_SIZE/2,
      PLAYER_SIZE/4,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Player glow when charging
    if (isCharging) {
      const glowSize = PLAYER_SIZE + 10 + chargeLevel * 5;
      const gradient = ctx.createRadialGradient(
        currentPlayer.x + PLAYER_SIZE/2, currentPlayer.y + PLAYER_SIZE/2, 0,
        currentPlayer.x + PLAYER_SIZE/2, currentPlayer.y + PLAYER_SIZE/2, glowSize
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 + chargeLevel * 0.1})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        currentPlayer.x + PLAYER_SIZE/2,
        currentPlayer.y + PLAYER_SIZE/2,
        glowSize,
        0, Math.PI * 2
      );
      ctx.fill();
    }

    // Draw player sprite
    const animTime = Date.now() - gameRefs.current.animationStartTime;
    const walkFrame = spriteManager.getAnimationFrame('walk', animTime);
    const playerSpriteName = getCharacterSpriteName(pet.character.id);
    spriteManager.drawSprite(
      ctx,
      playerSpriteName,
      currentPlayer.x + PLAYER_SIZE / 2,
      currentPlayer.y + PLAYER_SIZE / 2,
      walkFrame,
      PLAYER_SIZE / 16, // 16x16 sprites scaled to PLAYER_SIZE
      0 // No rotation
    );

    // Draw aim line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentPlayer.x + PLAYER_SIZE/2, currentPlayer.y + PLAYER_SIZE/2);
    const aimLineLength = 50;
    ctx.lineTo(
      currentPlayer.x + PLAYER_SIZE/2 + Math.cos(aimAngleRef.current) * aimLineLength,
      currentPlayer.y + PLAYER_SIZE/2 + Math.sin(aimAngleRef.current) * aimLineLength
    );
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw projectiles
    projectilesRef.current.forEach(projectile => {
      // Draw explosion radius for charged projectiles
      if (projectile.explosionRadius) {
        ctx.fillStyle = 'rgba(255, 107, 107, 0.15)';
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      // Draw trail for boomerang
      if (projectile.type === 'boomerang') {
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(
          projectile.x - Math.cos(projectile.angle) * 15,
          projectile.y - Math.sin(projectile.angle) * 15
        );
        ctx.lineTo(projectile.x, projectile.y);
        ctx.stroke();
      }
      
      // Draw projectile sprite
      const scale = projectile.explosionRadius ? 1.5 : 1.0;
      const spriteSize = 16;
      const rotation = projectile.type === 'boomerang' ? projectile.angle * 3 : projectile.angle;
      
      let spriteName = 'projectile-waterball';
      if (projectile.type === 'banana') spriteName = 'projectile-banana';
      else if (projectile.type === 'acorn') spriteName = 'projectile-acorn';
      else if (projectile.type === 'boomerang') spriteName = 'projectile-boomerang';
      
      spriteManager.drawSprite(
        ctx,
        spriteName,
        projectile.x - spriteSize/2,
        projectile.y - spriteSize/2,
        0,
        scale,
        rotation
      );
    });

    // Draw monsters
    monstersRef.current.forEach(monster => {
      const monsterSize = monster.isBoss ? BOSS_SIZE : MONSTER_SIZE;
      
      // Monster shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(
        monster.x + monsterSize/2,
        monster.y + monsterSize + 5,
        monsterSize/2,
        monsterSize/4,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Boss shield effect for robot
      if (monster.isBoss && (area.name.includes('Robot') || area.icon === '🤖') && !bossState.isVulnerable) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          monster.x + monsterSize/2,
          monster.y + monsterSize/2,
          monsterSize/2 + 5,
          0, Math.PI * 2
        );
        ctx.stroke();
        
        // Shield hit indicators
        ctx.font = '12px Arial';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText(
          `Shield: ${ROBOT_BOSS_SHIELD_HITS - bossState.shieldHits}`,
          monster.x + monsterSize/2,
          monster.y - 15
        );
      }

      // Vulnerable state glow for robot boss
      if (monster.isBoss && bossState.isVulnerable) {
        const gradient = ctx.createRadialGradient(
          monster.x + monsterSize/2, monster.y + monsterSize/2, 0,
          monster.x + monsterSize/2, monster.y + monsterSize/2, monsterSize + 15
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          monster.x + monsterSize/2,
          monster.y + monsterSize/2,
          monsterSize + 15,
          0, Math.PI * 2
        );
        ctx.fill();
      }

      // Monster glow when attacking
      if (monster.isAttacking) {
        const gradient = ctx.createRadialGradient(
          monster.x + monsterSize/2, monster.y + monsterSize/2, 0,
          monster.x + monsterSize/2, monster.y + monsterSize/2, monsterSize + 10
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          monster.x + monsterSize/2,
          monster.y + monsterSize/2,
          monsterSize + 10,
          0, Math.PI * 2
        );
        ctx.fill();
      }

      // DOT damage indicator (water droplets)
      if (monster.dotTimer && monster.dotTimer > 0) {
        const gradient = ctx.createRadialGradient(
          monster.x + monsterSize/2, monster.y + monsterSize/2, 0,
          monster.x + monsterSize/2, monster.y + monsterSize/2, monsterSize + 8
        );
        gradient.addColorStop(0, 'rgba(0, 191, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          monster.x + monsterSize/2,
          monster.y + monsterSize/2,
          monsterSize + 8,
          0, Math.PI * 2
        );
        ctx.fill();
        
        // Water droplet particles
        for (let i = 0; i < 3; i++) {
          const angle = (Date.now() / 500 + i * Math.PI * 2 / 3);
          const radius = monsterSize / 2 + 3;
          const x = monster.x + monsterSize/2 + Math.cos(angle) * radius;
          const y = monster.y + monsterSize/2 + Math.sin(angle) * radius;
          
          ctx.fillStyle = 'rgba(0, 191, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Monster emoji with bobbing and walking animation
      const bobOffset = Math.sin(Date.now() / 500 + monster.id) * 2;
      const scaleEffect = monster.isBoss 
        ? 1 + Math.sin(Date.now() / 300) * 0.05 
        : monster.isElite 
          ? 1 + Math.sin(Date.now() / 400) * 0.08 // Elite monsters pulse more
          : 1;
      
      // Walking animation - tilt left and right
      const walkCycle = Math.sin((monster.walkFrame || 0) * 0.3) * 0.15;
      
      // Elite glow aura - just an outline
      if (monster.isElite && !monster.isBoss) {
        const pulseIntensity = 0.6 + Math.sin(Date.now() / 300) * 0.4;
        ctx.strokeStyle = `rgba(255, 0, 255, ${pulseIntensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          monster.x + monsterSize/2,
          monster.y + monsterSize/2 + bobOffset,
          monsterSize/2 + 8,
          0, Math.PI * 2
        );
        ctx.stroke();
      }
      
      // Draw monster sprite
      const animTime = Date.now() - gameRefs.current.animationStartTime;
      const walkFrame = spriteManager.getAnimationFrame('walk', animTime);
      const sizeMultiplier = monster.isElite ? 1.35 : 1;
      
      let spriteName = monster.isElite || monster.isBoss ? 'enemy-rogue-elite' : 'enemy-rogue';
      
      spriteManager.drawSprite(
        ctx,
        spriteName,
        monster.x + monsterSize / 2,
        monster.y + monsterSize / 2 + bobOffset,
        walkFrame,
        (monsterSize / 16) * sizeMultiplier, // 16x16 sprites
        0 // No rotation
      );
      
      // Elite indicator - more prominent with pulsing stars
      if (monster.isElite && !monster.isBoss) {
        const starPulse = 1 + Math.sin(Date.now() / 200) * 0.3;
        ctx.save();
        ctx.translate(monster.x + monsterSize - 6, monster.y + 6);
        ctx.scale(starPulse, starPulse);
        
        ctx.font = 'bold 14px Arial'; // Increased from 10px
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 8;
        ctx.strokeText('⭐', 0, 0);
        ctx.fillText('⭐', 0, 0);
        ctx.restore();
      }

      // Health bar
      const barWidth = monsterSize;
      const barHeight = monster.isBoss ? 6 : 4;
      const healthPercent = monster.health / monster.maxHealth;
      
      // Background
      ctx.fillStyle = '#333';
      ctx.fillRect(
        monster.x,
        monster.y - 12 + bobOffset,
        barWidth,
        barHeight
      );
      
      // Health fill with gradient
      const healthGradient = ctx.createLinearGradient(monster.x, 0, monster.x + barWidth, 0);
      if (healthPercent > 0.5) {
        healthGradient.addColorStop(0, '#4CAF50');
        healthGradient.addColorStop(1, '#66BB6A');
      } else if (healthPercent > 0.25) {
        healthGradient.addColorStop(0, '#FFC107');
        healthGradient.addColorStop(1, '#FFD54F');
      } else {
        healthGradient.addColorStop(0, '#F44336');
        healthGradient.addColorStop(1, '#EF5350');
      }
      ctx.fillStyle = healthGradient;
      ctx.fillRect(
        monster.x,
        monster.y - 12 + bobOffset,
        barWidth * healthPercent,
        barHeight
      );
      
      // Boss label
      if (monster.isBoss) {
        const bobOffset = Math.sin(Date.now() / 500 + monster.id) * 2;
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('BOSS', monster.x + monsterSize/2, monster.y - 22 + bobOffset);
        ctx.fillText('BOSS', monster.x + monsterSize/2, monster.y - 22 + bobOffset);
      }
    });

    // Draw particles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(${parseInt(p.color.slice(1,3), 16)}, ${parseInt(p.color.slice(3,5), 16)}, ${parseInt(p.color.slice(5,7), 16)}, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw damage numbers
    gameRefs.current.damageNumbers.forEach(dn => {
      drawDamageNumber(ctx, dn);
    });
  }, [pet.character.emoji, area.icon, isCharging, chargeLevel, particles]);

  // Initialize sprite system
  useEffect(() => {
    initializePlaceholderSprites();
  }, []);

  // Update particles
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const updateParticles = () => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0)
      );
      
      // Update enhanced particles
      updateEnhancedParticles(gameRefs.current.enhancedParticles);
      
      // Update damage numbers
      gameRefs.current.damageNumbers = gameRefs.current.damageNumbers
        .map(dn => ({
          ...dn,
          y: dn.y - 1,
          life: dn.life - 0.016
        }))
        .filter(dn => dn.life > 0);
    };
    
    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [gameState]);

  // Update projectiles and check collisions
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const updateProjectiles = () => {
      const newProjectilesToAdd: Projectile[] = [];
      
      const updated = projectilesRef.current.map(proj => {
        let newProj = { ...proj };
        
        // Update based on projectile type
        switch (proj.type) {
          case 'boomerang':
            // Boomerang arcs and returns
            if (proj.arcProgress !== undefined) {
              proj.arcProgress += 0.02;
              
              if (proj.arcProgress >= 1) {
                // Start returning
                newProj.isReturning = true;
              }
              
              if (!newProj.isReturning) {
                // Arc outward
                newProj.x += proj.vx;
                newProj.y += proj.vy;
              } else {
                // Return to player
                const player = playerRef.current;
                const dx = (player.x + PLAYER_SIZE / 2) - newProj.x;
                const dy = (player.y + PLAYER_SIZE / 2) - newProj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 20) {
                  // Caught by player
                  newProj.distanceTraveled = newProj.maxDistance + 1;
                } else {
                  newProj.vx = (dx / dist) * (proj.returnSpeed || PROJECTILE_SPEED);
                  newProj.vy = (dy / dist) * (proj.returnSpeed || PROJECTILE_SPEED);
                  newProj.x += newProj.vx;
                  newProj.y += newProj.vy;
                }
              }
            }
            break;
            
          default:
            // Normal movement
            newProj.x += proj.vx;
            newProj.y += proj.vy;
            break;
        }
        
        newProj.distanceTraveled = proj.distanceTraveled + Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
        newProj.angle = proj.angle + 0.2; // Spin
        
        return newProj;
      });
      
      // Check collisions with monsters
      updated.forEach(proj => {
        let hitSomething = false;
        const isChargedAttack = proj.piercing;
        
        monstersRef.current.forEach(monster => {
          // Skip if this projectile already hit this monster (for piercing)
          if (proj.hitMonsters?.has(monster.id)) return;
          
          const monsterSize = monster.isBoss ? BOSS_SIZE : MONSTER_SIZE;
          const dx = proj.x - (monster.x + monsterSize / 2);
          const dy = proj.y - (monster.y + monsterSize / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Use explosion radius for charged attacks, normal collision otherwise
          const hitRadius = proj.explosionRadius ? proj.explosionRadius : monsterSize / 2;
          
          if (distance < hitRadius) {
            // Handle boss mechanics
            if (monster.isBoss) {
              const currentBoss = bossStateRef.current;
              
              // Robot boss mechanics
              if (area.name.includes('Robot') || area.icon === '🤖') {
                if (!currentBoss.isVulnerable && isChargedAttack) {
                  // Hit shield with charged attack
                  currentBoss.shieldHits++;
                  createHitParticles(proj.x, proj.y, '#00FFFF');
                  
                  if (currentBoss.shieldHits >= ROBOT_BOSS_SHIELD_HITS) {
                    // Break shield
                    currentBoss.isVulnerable = true;
                    currentBoss.vulnerableTimer = ROBOT_BOSS_VULNERABLE_TIME;
                  }
                  bossStateRef.current = { ...currentBoss };
                  setBossState({ ...currentBoss });
                } else if (currentBoss.isVulnerable && !isChargedAttack) {
                  // Vulnerable to auto attacks
                  monster.health -= proj.damage;
                  createHitParticles(proj.x, proj.y, '#FFD700');
                }
              }
              // Forest boss mechanics
              else if (area.name.includes('Forest') || area.icon === '🌲') {
                if (isChargedAttack) {
                  currentBoss.chargedHitsReceived++;
                  createHitParticles(proj.x, proj.y, '#00FF00');
                  
                  if (currentBoss.chargedHitsReceived >= 2 && !currentBoss.minionsSpawned) {
                    // Spawn minions
                    currentBoss.minionsSpawned = true;
                    spawnForestMinions();
                  }
                  bossStateRef.current = { ...currentBoss };
                  setBossState({ ...currentBoss });
                }
              }
              // Mountain boss mechanics
              else if (area.name.includes('Mountain') || area.icon === '⛰️') {
                if (!isChargedAttack && !currentBoss.hasSpawnedWave) {
                  // Auto attacks work on mountain boss
                  monster.health -= proj.damage;
                  createHitParticles(proj.x, proj.y, '#FFD700');
                  
                  // Check if reached 60% HP
                  const healthPercent = monster.health / monster.maxHealth;
                  if (healthPercent <= 0.6 && !currentBoss.hasSpawnedWave) {
                    currentBoss.hasSpawnedWave = true;
                    spawnMountainWave();
                    bossStateRef.current = { ...currentBoss };
                    setBossState({ ...currentBoss });
                  }
                } else if (isChargedAttack && currentBoss.hasSpawnedWave) {
                  // After minions phase, charged attacks work
                  const minions = monstersRef.current.filter(m => m.isMinion);
                  if (minions.length === 0) {
                    monster.health -= proj.damage;
                    createHitParticles(proj.x, proj.y, '#FF6B6B');
                  }
                }
              }
            }
            // Handle minion damage
            else if (monster.isMinion) {
              // Mountain minions require charged attacks
              if (monster.requiresCharged && isChargedAttack) {
                monster.health -= proj.damage;
                createHitParticles(proj.x, proj.y, '#FF6B6B');
              }
              // Forest minions require auto attacks
              else if (!monster.requiresCharged && !isChargedAttack) {
                monster.health -= proj.damage;
                createHitParticles(proj.x, proj.y, '#FFD700');
                // Add blood splatter and damage number
                gameRefs.current.enhancedParticles.push(...createBloodSplatter(monster.x + 12, monster.y + 12));
                gameRefs.current.damageNumbers.push(createDamageNumber(monster.x + 12, monster.y, proj.damage, false));
              }
            }
            // Normal monsters
            else {
              monster.health -= proj.damage;
              createHitParticles(proj.x, proj.y, proj.piercing ? '#FF6B6B' : '#FFD700');
              
              // Add damage number only
              const isCritical = isChargedAttack && proj.damage > 20;
              gameRefs.current.damageNumbers.push(createDamageNumber(monster.x + 12, monster.y, proj.damage, isCritical));
              
              // Apply special projectile effects
              switch (proj.type) {
                case 'waterball':
                  // Apply DOT
                  monster.dotDamage = proj.dotDamage;
                  monster.dotTimer = proj.dotDuration;
                  
                  // Splash damage to nearby enemies
                  if (proj.splashRadius) {
                    monstersRef.current.forEach(other => {
                      if (other.id === monster.id) return;
                      const otherSize = other.isBoss ? BOSS_SIZE : MONSTER_SIZE;
                      const odx = (other.x + otherSize / 2) - proj.x;
                      const ody = (other.y + otherSize / 2) - proj.y;
                      const oDist = Math.sqrt(odx * odx + ody * ody);
                      
                      if (oDist < (proj.splashRadius || 0)) {
                        other.health -= Math.floor(proj.damage * 0.5);
                        createHitParticles(other.x + otherSize / 2, other.y + otherSize / 2, '#00BFFF');
                      }
                    });
                  }
                  break;
                  
                case 'banana':
                  // Split into smaller projectiles on first hit
                  if (!proj.hasSplit && proj.splitCount) {
                    proj.hasSplit = true;
                    const angleStep = (Math.PI * 2) / proj.splitCount;
                    
                    for (let i = 0; i < proj.splitCount; i++) {
                      const splitAngle = i * angleStep;
                      newProjectilesToAdd.push({
                        ...proj,
                        id: Date.now() + Math.random() + i,
                        damage: Math.floor(proj.damage * 0.4),
                        vx: Math.cos(splitAngle) * (PROJECTILE_SPEED * 0.6),
                        vy: Math.sin(splitAngle) * (PROJECTILE_SPEED * 0.6),
                        angle: splitAngle,
                        maxDistance: 120,
                        distanceTraveled: 0,
                        icon: '🍌',
                        piercing: false,
                        explosionRadius: 0,
                        hitMonsters: new Set(),
                      });
                    }
                  }
                  break;
                  
                case 'acorn':
                  // Bounce to another nearby enemy
                  if (proj.bounceCount !== undefined && proj.maxBounces !== undefined && proj.bounceCount < proj.maxBounces) {
                    let closestMonster: Monster | null = null;
                    let closestDist = Infinity;
                    
                    monstersRef.current.forEach(other => {
                      if (proj.hitMonsters?.has(other.id)) return;
                      const otherSize = other.isBoss ? BOSS_SIZE : MONSTER_SIZE;
                      const odx = (other.x + otherSize / 2) - proj.x;
                      const ody = (other.y + otherSize / 2) - proj.y;
                      const oDist = Math.sqrt(odx * odx + ody * ody);
                      
                      if (oDist < closestDist && oDist < 150) {
                        closestDist = oDist;
                        closestMonster = other;
                      }
                    });
                    
                    if (closestMonster) {
                      const targetMonster: Monster = closestMonster;
                      proj.bounceCount++;
                      const targetSize = targetMonster.isBoss ? BOSS_SIZE : MONSTER_SIZE;
                      const dx = (targetMonster.x + targetSize / 2) - proj.x;
                      const dy = (targetMonster.y + targetSize / 2) - proj.y;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      
                      proj.vx = (dx / dist) * PROJECTILE_SPEED * 1.2;
                      proj.vy = (dy / dist) * PROJECTILE_SPEED * 1.2;
                      proj.distanceTraveled = 0;
                    } else {
                      // No more enemies to bounce to
                      proj.distanceTraveled = proj.maxDistance + 1;
                    }
                  }
                  break;
              }
            }
            
            proj.hitMonsters?.add(monster.id);
            hitSomething = true;
          }
        });
        
        // If explosion hit something and not piercing, mark for removal
        if (hitSomething && !proj.piercing) {
          proj.distanceTraveled = proj.maxDistance + 1;
        }
      });
      
      // Remove dead monsters and out-of-range projectiles
      const aliveMonsters = monstersRef.current.filter(m => m.health > 0);
      const deadMonsters = monstersRef.current.filter(m => m.health <= 0);
      
      // Forest boss: Check if minions died
      if (area.name.includes('Forest') || area.icon === '🌲') {
        const deadMinions = deadMonsters.filter(m => m.isMinion);
        if (deadMinions.length > 0 && bossStateRef.current.minionsSpawned) {
          const boss = monstersRef.current.find(m => m.isBoss);
          if (boss) {
            // Damage boss by 33% when minions die
            boss.health -= boss.maxHealth * 0.33;
            bossStateRef.current.phase++;
            bossStateRef.current.minionsSpawned = false;
            bossStateRef.current.chargedHitsReceived = 0;
            setBossState({ ...bossStateRef.current });
          }
        }
      }
      
      const killedCount = deadMonsters.length;
      if (killedCount > 0) {
        setScore(s => s + killedCount * 10 * level);
      }
      monstersRef.current = aliveMonsters;
      setMonsters(aliveMonsters);
      
      const validProjectiles = updated.filter(p => 
        p.distanceTraveled <= p.maxDistance &&
        p.x >= -50 && p.x <= GAME_WIDTH + 50 &&
        p.y >= -50 && p.y <= GAME_HEIGHT + 50
      );
      
      projectilesRef.current = [...validProjectiles, ...newProjectilesToAdd];
    };
    
    const interval = setInterval(updateProjectiles, 16);
    return () => clearInterval(interval);
  }, [gameState, createHitParticles, level, spawnForestMinions, spawnMountainWave, area.name, area.icon]);

  // Render loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const renderLoop = () => {
      render();
      renderLoopRef.current = requestAnimationFrame(renderLoop);
    };
    
    renderLoopRef.current = requestAnimationFrame(renderLoop);
    
    return () => {
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
      }
    };
  }, [gameState, render]);

  // Mouse/Touch tracking for aiming
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // Calculate target aim angle
      const player = playerRef.current;
      const dx = x - (player.x + PLAYER_SIZE / 2);
      const dy = y - (player.y + PLAYER_SIZE / 2);
      targetAimAngleRef.current = Math.atan2(dy, dx);
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove as any);
      canvas.addEventListener('touchmove', handleMouseMove as any);
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove as any);
        canvas.removeEventListener('touchmove', handleMouseMove as any);
      }
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if ((e.key === ' ' || e.key === 'Space') && !chargeStartTime.current) {
        e.preventDefault();
        startCharging();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (chargeStartTime.current) {
          releaseCharge();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Movement loop
    const moveLoop = () => {
      // Smooth aim interpolation (slower aiming)
      const targetAngle = targetAimAngleRef.current;
      const currentAngle = aimAngleRef.current;
      
      // Handle angle wrapping (shortest path)
      let angleDiff = targetAngle - currentAngle;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Interpolate with smoothing factor (0.15 = slower, 0.3 = faster)
      aimAngleRef.current = currentAngle + angleDiff * 0.12;
      
      // Update player position directly
      let { x, y, facing } = playerRef.current;
      let horizontalMove = false;
      let verticalMove = false;
      
      // Track movement and update position
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
        x = Math.max(0, x - MOVE_SPEED);
        horizontalMove = true;
        facing = 'left';
      }
      if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
        x = Math.min(GAME_WIDTH - PLAYER_SIZE, x + MOVE_SPEED);
        horizontalMove = true;
        facing = 'right';
      }
      // Vertical movement takes priority over horizontal for facing direction
      // This makes sense since enemies come from top and sides
      if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
        y = Math.max(0, y - MOVE_SPEED);
        verticalMove = true;
        facing = 'up';
      }
      if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
        y = Math.min(GAME_HEIGHT - PLAYER_SIZE, y + MOVE_SPEED);
        verticalMove = true;
        facing = 'down';
      }
      
      // If only horizontal movement, keep that facing direction
      // (already set above, vertical will override if both are pressed)
      if (horizontalMove && !verticalMove) {
        // facing is already set correctly from horizontal movement
      }
      
      playerRef.current = { x, y, facing };

      // Auto-attack (if not charging)
      const now = Date.now();
      if (!chargeStartTime.current && now - lastAutoAttackTime.current >= attackCooldown) {
        lastAutoAttackTime.current = now;
        shootProjectile(0);
      }

      // Update robot boss vulnerable timer
      if (bossStateRef.current.isVulnerable) {
        bossStateRef.current.vulnerableTimer -= 16;
        if (bossStateRef.current.vulnerableTimer <= 0) {
          bossStateRef.current.isVulnerable = false;
          bossStateRef.current.shieldHits = 0;
          setBossState({ ...bossStateRef.current });
        }
      }

      // Move monsters towards player and handle attack state
      const currentPlayerPos = playerRef.current;
      const updatedMonsters = monstersRef.current.map(monster => {
        const dx = currentPlayerPos.x - monster.x;
        const dy = currentPlayerPos.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Reduced base speed to make movement smoother, with elite multiplier
        const baseSpeed = 0.2 + area.difficulty * 0.15;
        const speed = baseSpeed * (monster.speedMultiplier || 1);
        
        // Update walk animation frame when moving
        const isMoving = dist > (monster.isBoss ? BOSS_SIZE : MONSTER_SIZE) / 2;
        const walkFrame = isMoving ? (monster.walkFrame || 0) + 1 : (monster.walkFrame || 0);
        
        const monsterSize = monster.isBoss ? BOSS_SIZE : MONSTER_SIZE;
        // Check if monster is close enough to attack
        const attackDistance = PLAYER_SIZE + monsterSize;
        const isAttacking = dist < attackDistance;
        
        // Bosses don't move in certain states
        let shouldMove = true;
        if (monster.isBoss) {
          // Robot boss doesn't move when vulnerable
          if ((area.name.includes('Robot') || area.icon === '🤖') && bossStateRef.current.isVulnerable) {
            shouldMove = false;
          }
          // Mountain boss doesn't move when minion wave is active
          if ((area.name.includes('Mountain') || area.icon === '⛰️') && bossStateRef.current.hasSpawnedWave) {
            const minions = monstersRef.current.filter(m => m.isMinion);
            if (minions.length > 0) {
              shouldMove = false;
            }
          }
        }
        
        // Move towards player if not too close and should move
        let newX = monster.x;
        let newY = monster.y;
        if (shouldMove && dist > monsterSize / 2) {
          // Normalize direction and apply speed
          newX = monster.x + (dx / dist) * speed;
          newY = monster.y + (dy / dist) * speed;
        }
        
        // Apply DOT damage
        let updatedHealth = monster.health;
        let updatedDotTimer = monster.dotTimer;
        if (monster.dotTimer && monster.dotTimer > 0 && monster.dotDamage) {
          updatedDotTimer = monster.dotTimer - (1000 / 60); // Decrease by frame time
          if (updatedDotTimer > 0) {
            // Apply DOT damage every 0.5 seconds
            const dotTickInterval = 500;
            const prevTick = Math.floor((monster.dotTimer || 0) / dotTickInterval);
            const currTick = Math.floor(updatedDotTimer / dotTickInterval);
            if (prevTick > currTick) {
              updatedHealth -= monster.dotDamage;
            }
          } else {
            updatedDotTimer = 0;
          }
        }
        
        return {
          ...monster,
          x: newX,
          y: newY,
          isAttacking,
          health: updatedHealth,
          dotTimer: updatedDotTimer,
          walkFrame,
        };
      });
      
      monstersRef.current = updatedMonsters;
      setMonsters(updatedMonsters);

      gameLoopRef.current = requestAnimationFrame(moveLoop);
    };

    gameLoopRef.current = requestAnimationFrame(moveLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, [gameState, startCharging, releaseCharge, area.difficulty, shootProjectile, attackCooldown]);

  // Timer and victory check
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Check if boss was defeated (victory) or time ran out (defeat)
          const bossDefeated = level === MAX_LEVEL && !monstersRef.current.some(m => m.isBoss);
          endGame(level, bossDefeated);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, level]);

  // Continuous spawning system
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const spawnInterval = setInterval(() => {
      const now = Date.now();
      elapsedTime.current = GAME_DURATION - timeLeft;
      
      // Calculate current level (1-6)
      const currentLevel = Math.min(Math.ceil(elapsedTime.current / LEVEL_DURATION), MAX_LEVEL);
      if (currentLevel !== level) {
        setLevel(currentLevel);
        
        // Spawn boss when reaching final level
        if (currentLevel === MAX_LEVEL && !monstersRef.current.some(m => m.isBoss)) {
          spawnBoss();
        }
      }
      
      // Don't spawn regular monsters if boss is alive
      if (monstersRef.current.some(m => m.isBoss)) {
        return;
      }
      
      // Calculate spawn rate based on level (faster spawning as level increases)
      const baseSpawnDelay = 1500; // 1.5 seconds
      const spawnDelay = baseSpawnDelay - (currentLevel * 250); // Reduce by 250ms per level (increased from 200ms)
      
      if (now - lastSpawnTime.current >= Math.max(spawnDelay, 400)) {
        // Spawn multiple monsters at higher levels (more aggressive spawning)
        let monstersToSpawn = 2;
        if (currentLevel >= 3) monstersToSpawn = 4;
        if (currentLevel >= 5) monstersToSpawn = 5;
        
        for (let i = 0; i < monstersToSpawn; i++) {
          spawnMonster(currentLevel);
        }
        
        lastSpawnTime.current = now;
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(spawnInterval);
  }, [gameState, timeLeft, level, spawnMonster, spawnBoss]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setLevel(1);
    setScore(0);
    monstersRef.current = [];
    setMonsters([]);
    lastSpawnTime.current = Date.now();
    elapsedTime.current = 0;
    const initialPlayer = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, facing: 'up' as Direction };
    playerRef.current = initialPlayer;
  };

  const endGame = (levelsCompleted: number, success: boolean) => {
    setGameState('finished');
    keysPressed.current.clear();
    
    const xpReward = score + levelsCompleted * 50 * area.difficulty;
    const coinReward = Math.floor(score / 2) + levelsCompleted * 20 * area.difficulty;
    
    // Chance to get equipment based on levels completed and difficulty
    const equipChance = (levelsCompleted / MAX_LEVEL) * (0.3 + area.difficulty * 0.05);
    const equipment: Equipment | undefined = Math.random() < equipChance 
      ? getRandomEquipment(area.difficulty) 
      : undefined;
    
    const gameResult: MinigameResult = {
      success,
      wavesCompleted: levelsCompleted,
      totalWaves: MAX_LEVEL,
      rewards: {
        xp: xpReward,
        coins: coinReward,
        equipment,
      },
    };
    
    setResult(gameResult);
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
    onClose();
  };

  const getWeaknessLabel = (weakness: keyof Attributes): string => {
    const labels: Record<keyof Attributes, string> = {
      speed: '⚡ Speed',
      wisdom: '🧠 Wisdom',
      strength: '💪 Strength',
      clarity: '✨ Clarity',
    };
    return labels[weakness];
  };

  return (
    <div className="minigame-overlay">
      <div className="minigame-container">
        {gameState === 'ready' && (
          <div className="minigame-ready">
            <h2>{area.icon} {area.name}</h2>
            <p className="area-description">{area.description}</p>
            <p className="weakness-info">
              Monsters are weak to: {getWeaknessLabel(area.attributeWeakness)}
            </p>
            <p className="your-stat">
              Your {area.attributeWeakness}: {pet.attributes[area.attributeWeakness]}
            </p>
            <div className="controls-info">
              <p>🖱️ Move mouse/tap to aim</p>
              <p>⬆️⬇️⬅️➡️ or WASD to move</p>
              <p>🪃 Auto-attacks toward your aim</p>
              <p>⚡ Hold SPACE for 0.5s+ to charge special attack (max 1.5s for 3x power)</p>
              <p>Survive 3 minutes! Defeat the boss at level 6 to win!</p>
              <p>⭐ <strong>Elite monsters</strong> have 3x health and move 2x faster!</p>
              <div className="attribute-effects">
                <p><strong>💪 Strength</strong> increases damage</p>
                <p><strong>⚡ Speed</strong> increases attack frequency</p>
              </div>
            </div>
            <div className="ready-buttons">
              <button className="start-btn" onClick={startGame}>
                ⚔️ Start Battle!
              </button>
              <button className="cancel-btn" onClick={onClose}>
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="minigame-playing">
            <div className="game-hud">
              <span className="wave-indicator">Level {level}/{MAX_LEVEL}</span>
              <span className="time-indicator">⏱️ {timeLeft}s</span>
              <span className="score-indicator">Score: {score}</span>
              <button className="cancel-game-btn" onClick={onClose} title="Cancel and exit">
                ❌
              </button>
            </div>
            
            <canvas
              ref={canvasRef}
              className="game-arena"
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            />
            
            {isCharging && (
              <div className="charge-ui">
                <div className="charge-bar-container">
                  <div 
                    className={`charge-bar-fill charge-level-${chargeLevel}`}
                    style={{ width: `${(chargeLevel / MAX_CHARGE_LEVEL) * 100}%` }}
                  />
                  <div className="charge-segments">
                    <div className="charge-segment" style={{ left: '33.33%' }} />
                    <div className="charge-segment" style={{ left: '66.66%' }} />
                  </div>
                </div>
                <span className="charge-level-text">
                  {chargeLevel === 0 ? 'Charging...' : `${chargeLevel}X POWER!`}
                </span>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && result && (
          <div className="minigame-finished">
            <h2>{result.success ? '🎉 Victory!' : '💀 Time\'s Up!'}</h2>
            <p className="waves-result">
              Levels Completed: {result.wavesCompleted}/{result.totalWaves}
            </p>
            <div className="rewards-section">
              <h3>Rewards:</h3>
              <p>⭐ {result.rewards?.xp} XP</p>
              <p>🪙 {result.rewards?.coins} Coins</p>
              {result.rewards?.equipment && (
                <div className="equipment-reward">
                  <span className={`rarity-${result.rewards.equipment.rarity}`}>
                    {result.rewards.equipment.icon} {result.rewards.equipment.name}
                  </span>
                  <span className="equipment-rarity">({result.rewards.equipment.rarity})</span>
                </div>
              )}
            </div>
            <button className="complete-btn" onClick={handleComplete}>
              ✓ Collect Rewards
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

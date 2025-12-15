import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet, Area, Equipment, MinigameResult, Attributes } from '../types/pet';
import { getRandomEquipment, getEquipmentBonuses } from '../types/pet';
import './Minigame.css';

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
}

interface Player {
  x: number;
  y: number;
  facing: Direction;
}

const GAME_WIDTH = 500;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 30;
const MONSTER_SIZE = 25;
const MOVE_SPEED = 2;
const GAME_DURATION = 30; // 30 seconds
const TOTAL_WAVES = 5;
const ATTACK_RANGE = 60;
const ATTACK_ARC = 90; // degrees
const CHARGE_INTERVAL = 500; // 0.5 second intervals for charge levels (max 6 levels = 3 seconds)

export const Minigame = ({ pet, area, onComplete, onClose }: MinigameProps) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [player, setPlayer] = useState<Player>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, facing: 'up' });
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [wave, setWave] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [attacking, setAttacking] = useState(false);
  const [attackDirection, setAttackDirection] = useState<Direction>('up');
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [chargeDirection, setChargeDirection] = useState<Direction>('up');
  
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const lastAttackTime = useRef<number>(0);
  const playerRef = useRef<Player>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, facing: 'up' });
  const chargeStartTime = useRef<number | null>(null);
  const chargeIntervalRef = useRef<number | null>(null);
  const chargeDirectionRef = useRef<Direction>('up');

  // Calculate player's attack power based on attributes and equipment
  const getPlayerPower = useCallback(() => {
    const equipBonuses = getEquipmentBonuses(pet.equipped);
    const weaknessAttr = area.attributeWeakness;
    const attrValue = pet.attributes[weaknessAttr] + (equipBonuses[weaknessAttr] || 0);
    const basePower = 10 + Math.floor(attrValue / 5);
    const attackBonus = equipBonuses.attackPower || 0;
    return basePower + attackBonus;
  }, [pet, area]);

  // Spawn monsters for the current wave from top and sides
  const spawnMonsters = useCallback((waveNum: number) => {
    const count = 3 + waveNum + Math.floor(area.difficulty / 2);
    const newMonsters: Monster[] = [];
    
    const sides: SpawnSide[] = ['top', 'left', 'right'];
    
    for (let i = 0; i < count; i++) {
      const baseHealth = 20 + waveNum * 10 + area.difficulty * 5;
      const side = sides[i % sides.length];
      
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
        id: Date.now() + i,
        x,
        y,
        health: baseHealth,
        maxHealth: baseHealth,
        isAttacking: false,
        spawnSide: side,
      });
    }
    
    setMonsters(newMonsters);
  }, [area.difficulty]);

  // Handle attack - directional attack in front of the player
  // Now accepts optional charge parameters for charged attacks
  const attack = useCallback((chargedLevel = 0, forcedDirection?: Direction) => {
    const now = Date.now();
    if (now - lastAttackTime.current < 300) return; // Attack cooldown
    lastAttackTime.current = now;
    
    const currentPlayer = playerRef.current;
    // Use forced direction for charged attacks, otherwise use current facing
    const direction = forcedDirection ?? currentPlayer.facing;
    setAttackDirection(direction);
    setAttacking(true);
    setTimeout(() => setAttacking(false), 200);
    
    // Calculate power and range based on charge level (0-6)
    // Each charge level adds 50% damage and 20 range
    const basePower = getPlayerPower();
    const chargeMultiplier = 1 + (chargedLevel * 0.5);
    const power = Math.floor(basePower * chargeMultiplier);
    const range = ATTACK_RANGE + (chargedLevel * 20);
    
    // Calculate attack area based on attack direction
    const playerCenterX = currentPlayer.x + PLAYER_SIZE / 2;
    const playerCenterY = currentPlayer.y + PLAYER_SIZE / 2;
    
    // Get the direction vector for attack
    let dirX = 0, dirY = 0;
    switch (direction) {
      case 'up': dirY = -1; break;
      case 'down': dirY = 1; break;
      case 'left': dirX = -1; break;
      case 'right': dirX = 1; break;
    }
    
    setMonsters(prev => {
      const updated = prev.map(monster => {
        const monsterCenterX = monster.x + MONSTER_SIZE / 2;
        const monsterCenterY = monster.y + MONSTER_SIZE / 2;
        
        // Vector from player to monster
        const dx = monsterCenterX - playerCenterX;
        const dy = monsterCenterY - playerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if monster is within attack range (includes charge bonus)
        if (distance > range) return monster;
        
        // Check if monster is in front of the player (within attack arc)
        // Calculate angle between attack direction and monster direction
        const dotProduct = dx * dirX + dy * dirY;
        const cosAngle = dotProduct / distance;
        const angleThreshold = Math.cos((ATTACK_ARC / 2) * Math.PI / 180);
        
        // Monster is in the attack arc if the direction is correct
        if (cosAngle >= angleThreshold) {
          return { ...monster, health: monster.health - power };
        }
        
        return monster;
      });
      
      // Count killed monsters
      const killed = updated.filter(m => m.health <= 0).length;
      if (killed > 0) {
        setScore(s => s + killed * 10 * wave);
      }
      
      return updated.filter(m => m.health > 0);
    });
  }, [getPlayerPower, wave]);

  // Start charging an attack
  const startCharging = useCallback(() => {
    const currentPlayer = playerRef.current;
    chargeStartTime.current = Date.now();
    chargeDirectionRef.current = currentPlayer.facing;
    setIsCharging(true);
    setChargeLevel(0);
    setChargeDirection(currentPlayer.facing);
    
    // Update charge level every 250ms for smooth visual feedback
    chargeIntervalRef.current = window.setInterval(() => {
      if (chargeStartTime.current) {
        const elapsed = Date.now() - chargeStartTime.current;
        const newLevel = Math.min(Math.floor(elapsed / CHARGE_INTERVAL), 6); // Max 6 levels (3 seconds)
        setChargeLevel(newLevel);
      }
    }, 250);
  }, []);

  // Release charged attack
  const releaseCharge = useCallback(() => {
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    
    if (chargeStartTime.current) {
      const elapsed = Date.now() - chargeStartTime.current;
      const finalLevel = Math.min(Math.floor(elapsed / CHARGE_INTERVAL), 6);
      // Use the locked direction from the ref
      const lockedDirection = chargeDirectionRef.current;
      attack(finalLevel, lockedDirection);
    }
    
    chargeStartTime.current = null;
    setIsCharging(false);
    setChargeLevel(0);
  }, [attack]);

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
      setPlayer(prev => {
        let { x, y, facing } = prev;
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
        
        const newPlayer = { x, y, facing };
        playerRef.current = newPlayer;
        return newPlayer;
      });

      // Move monsters towards player and handle attack state
      setMonsters(prev => prev.map(monster => {
        const currentPlayerPos = playerRef.current;
        const dx = currentPlayerPos.x - monster.x;
        const dy = currentPlayerPos.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.4 + area.difficulty * 0.1; // Reduced from 1.5 + 0.3
        
        // Check if monster is close enough to attack
        const attackDistance = PLAYER_SIZE + MONSTER_SIZE;
        const isAttacking = dist < attackDistance;
        
        // Move towards player if not too close
        let newX = monster.x;
        let newY = monster.y;
        if (dist > MONSTER_SIZE) {
          newX = monster.x + (dx / dist) * speed;
          newY = monster.y + (dy / dist) * speed;
        }
        
        return {
          ...monster,
          x: newX,
          y: newY,
          isAttacking,
        };
      }));

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
  }, [gameState, startCharging, releaseCharge, area.difficulty]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(wave, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Check wave completion
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (monsters.length === 0 && wave <= TOTAL_WAVES) {
      if (wave >= TOTAL_WAVES) {
        endGame(wave, true);
      } else {
        setWave(w => w + 1);
        spawnMonsters(wave + 1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monsters.length, wave, gameState]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(GAME_DURATION);
    setWave(1);
    setScore(0);
    const initialPlayer = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, facing: 'up' as Direction };
    setPlayer(initialPlayer);
    playerRef.current = initialPlayer;
    spawnMonsters(1);
  };

  const endGame = (wavesCompleted: number, success: boolean) => {
    setGameState('finished');
    keysPressed.current.clear();
    
    const xpReward = score + wavesCompleted * 50 * area.difficulty;
    const coinReward = Math.floor(score / 2) + wavesCompleted * 20 * area.difficulty;
    
    // Chance to get equipment based on waves completed and difficulty
    const equipChance = (wavesCompleted / TOTAL_WAVES) * (0.3 + area.difficulty * 0.05);
    const equipment: Equipment | undefined = Math.random() < equipChance 
      ? getRandomEquipment(area.difficulty) 
      : undefined;
    
    const gameResult: MinigameResult = {
      success,
      wavesCompleted,
      totalWaves: TOTAL_WAVES,
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
              <p>⬆️⬇️⬅️➡️ or WASD to move</p>
              <p>Hold SPACE to charge attack (up to 3s)</p>
              <p>Release SPACE to unleash charged attack</p>
              <p>Survive 30 seconds and defeat all waves!</p>
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
              <span className="wave-indicator">Wave {wave}/{TOTAL_WAVES}</span>
              <span className="time-indicator">⏱️ {timeLeft}s</span>
              <span className="score-indicator">Score: {score}</span>
            </div>
            
            <div 
              className="game-arena"
              style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            >
              <div 
                className={`game-player ${attacking ? 'attacking' : ''} ${isCharging ? 'charging' : ''} facing-${player.facing}`}
                style={{ 
                  left: player.x, 
                  top: player.y,
                  width: PLAYER_SIZE,
                  height: PLAYER_SIZE,
                }}
              >
                {pet.character.emoji}
                {attacking && (
                  <div className={`attack-slash attack-${attackDirection}`}>
                    ⚔️
                  </div>
                )}
                {isCharging && (
                  <div className={`charge-indicator charge-level-${chargeLevel} charge-${chargeDirection}`}>
                    <div className="charge-bar" style={{ width: `${(chargeLevel / 6) * 100}%` }} />
                    <span className="charge-direction-arrow">
                      {chargeDirection === 'up' ? '↑' : chargeDirection === 'down' ? '↓' : chargeDirection === 'left' ? '←' : '→'}
                    </span>
                  </div>
                )}
              </div>
              
              {monsters.map(monster => (
                <div 
                  key={monster.id}
                  className={`game-monster ${monster.isAttacking ? 'monster-attacking' : ''}`}
                  style={{ 
                    left: monster.x, 
                    top: monster.y,
                    width: MONSTER_SIZE,
                    height: MONSTER_SIZE,
                  }}
                >
                  {area.icon}
                  <div className="monster-health">
                    <div 
                      className="monster-health-fill"
                      style={{ width: `${(monster.health / monster.maxHealth) * 100}%` }}
                    />
                  </div>
                  {monster.isAttacking && (
                    <div className="monster-attack-indicator">💥</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'finished' && result && (
          <div className="minigame-finished">
            <h2>{result.success ? '🎉 Victory!' : '💀 Time\'s Up!'}</h2>
            <p className="waves-result">
              Waves Completed: {result.wavesCompleted}/{result.totalWaves}
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

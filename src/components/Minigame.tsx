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

interface Monster {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
}

interface Player {
  x: number;
  y: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const PLAYER_SIZE = 30;
const MONSTER_SIZE = 25;
const MOVE_SPEED = 8;
const GAME_DURATION = 30; // 30 seconds
const TOTAL_WAVES = 5;

export const Minigame = ({ pet, area, onComplete, onClose }: MinigameProps) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [player, setPlayer] = useState<Player>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [wave, setWave] = useState(1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [attacking, setAttacking] = useState(false);
  const [result, setResult] = useState<MinigameResult | null>(null);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const lastAttackTime = useRef<number>(0);

  // Calculate player's attack power based on attributes and equipment
  const getPlayerPower = useCallback(() => {
    const equipBonuses = getEquipmentBonuses(pet.equipped);
    const weaknessAttr = area.attributeWeakness;
    const attrValue = pet.attributes[weaknessAttr] + (equipBonuses[weaknessAttr] || 0);
    const basePower = 10 + Math.floor(attrValue / 5);
    const attackBonus = equipBonuses.attackPower || 0;
    return basePower + attackBonus;
  }, [pet, area]);

  // Spawn monsters for the current wave
  const spawnMonsters = useCallback((waveNum: number) => {
    const count = 3 + waveNum + Math.floor(area.difficulty / 2);
    const newMonsters: Monster[] = [];
    
    for (let i = 0; i < count; i++) {
      const baseHealth = 20 + waveNum * 10 + area.difficulty * 5;
      newMonsters.push({
        id: Date.now() + i,
        x: Math.random() * (GAME_WIDTH - MONSTER_SIZE),
        y: Math.random() * (GAME_HEIGHT - MONSTER_SIZE),
        health: baseHealth,
        maxHealth: baseHealth,
      });
    }
    
    setMonsters(newMonsters);
  }, [area.difficulty]);

  // Handle attack
  const attack = useCallback(() => {
    const now = Date.now();
    if (now - lastAttackTime.current < 200) return; // Attack cooldown
    lastAttackTime.current = now;
    
    setAttacking(true);
    setTimeout(() => setAttacking(false), 150);
    
    const power = getPlayerPower();
    const attackRadius = 50;
    
    setMonsters(prev => {
      const updated = prev.map(monster => {
        const dx = (monster.x + MONSTER_SIZE / 2) - (player.x + PLAYER_SIZE / 2);
        const dy = (monster.y + MONSTER_SIZE / 2) - (player.y + PLAYER_SIZE / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= attackRadius) {
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
  }, [player, getPlayerPower, wave]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        attack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Movement loop
    const moveLoop = () => {
      setPlayer(prev => {
        let { x, y } = prev;
        
        if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
          x = Math.max(0, x - MOVE_SPEED);
        }
        if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
          x = Math.min(GAME_WIDTH - PLAYER_SIZE, x + MOVE_SPEED);
        }
        if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
          y = Math.max(0, y - MOVE_SPEED);
        }
        if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
          y = Math.min(GAME_HEIGHT - PLAYER_SIZE, y + MOVE_SPEED);
        }
        
        return { x, y };
      });

      // Move monsters towards player
      setMonsters(prev => prev.map(monster => {
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 1 + area.difficulty * 0.2;
        
        return {
          ...monster,
          x: monster.x + (dx / dist) * speed,
          y: monster.y + (dy / dist) * speed,
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
    };
  }, [gameState, attack, player, area.difficulty]);

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
    setPlayer({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
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
              <p>SPACE to attack</p>
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
                className={`game-player ${attacking ? 'attacking' : ''}`}
                style={{ 
                  left: player.x, 
                  top: player.y,
                  width: PLAYER_SIZE,
                  height: PLAYER_SIZE,
                }}
              >
                {pet.character.emoji}
                {attacking && <div className="attack-circle" />}
              </div>
              
              {monsters.map(monster => (
                <div 
                  key={monster.id}
                  className="game-monster"
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

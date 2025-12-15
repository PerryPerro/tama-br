import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet, PetStats, PetMood, BrainRotCharacter, UpgradeId, OwnedUpgrade, Attributes, Equipment, Area, MinigameResult } from '../types/pet';
import { getXpForLevel, getCoinsForLevel, getBaseXpForAction, UPGRADES, getUpgradeCost, getEvolutionCount, AUTO_CARETAKER_INTERVAL, AUTO_CARETAKER_STAT_BOOST, AREAS, getRandomEquipment, isAreaUnlocked } from '../types/pet';

const STORAGE_KEY = 'brainrot-tamagotchi-save';
const DECAY_INTERVAL = 3000; // Stats decay every 3 seconds
const DECAY_AMOUNT = 2;      // Amount stats decay

const calculateMood = (stats: PetStats, isAlive: boolean): PetMood => {
  if (!isAlive) return 'dead';
  
  const avgStats = (stats.hunger + stats.happiness + stats.energy + stats.hygiene) / 4;
  
  if (stats.hygiene < 20) return 'dirty';
  if (stats.energy < 20) return 'sleeping';
  if (avgStats >= 70) return 'happy';
  if (avgStats >= 40) return 'neutral';
  return 'sad';
};

const checkIfAlive = (stats: PetStats): boolean => {
  return stats.hunger > 0 && stats.happiness > 0 && stats.energy > 0;
};

// Get upgrade level from owned upgrades
const getUpgradeLevel = (upgrades: OwnedUpgrade[], id: UpgradeId): number => {
  const upgrade = upgrades.find(u => u.id === id);
  return upgrade?.level ?? 0;
};

// Calculate stat multiplier based on click power upgrade
const getStatMultiplier = (upgrades: OwnedUpgrade[]): number => {
  const clickPowerLevel = getUpgradeLevel(upgrades, 'clickPower');
  return 1 + (clickPowerLevel * 0.10); // 10% per level
};

// Calculate XP multiplier based on XP boost upgrade
const getXpMultiplier = (upgrades: OwnedUpgrade[]): number => {
  const xpBoostLevel = getUpgradeLevel(upgrades, 'xpBoost');
  return 1 + (xpBoostLevel * 0.15); // 15% per level
};

// Calculate coin multiplier based on coin boost upgrade
const getCoinMultiplier = (upgrades: OwnedUpgrade[]): number => {
  const coinBoostLevel = getUpgradeLevel(upgrades, 'coinBoost');
  return 1 + (coinBoostLevel * 0.20); // 20% per level
};

// Migrate old save data to new format
const migratePet = (pet: Pet): Pet => {
  // Add missing fields for backwards compatibility
  return {
    ...pet,
    attributes: pet.attributes || { speed: 0, wisdom: 0, strength: 0, clarity: 0 },
    evolutionCount: pet.evolutionCount ?? (('isEvolved' in pet && (pet as unknown as { isEvolved: boolean }).isEvolved) ? 1 : 0),
    inventory: pet.inventory || [],
    equipped: pet.equipped || {},
    unlockedAreas: pet.unlockedAreas || ['scrapyard_1', 'forest_1', 'mountain_1', 'ocean_1'],
    areaProgress: pet.areaProgress || {},
  };
};

// Load saved game from localStorage
const loadSavedGame = (): { pet: Pet | null; gameStarted: boolean } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        pet: data.pet ? migratePet(data.pet) : null,
        gameStarted: data.gameStarted,
      };
    }
  } catch (error) {
    console.error('Failed to load saved game:', error);
  }
  return { pet: null, gameStarted: false };
};

// Save game to localStorage
const saveGame = (pet: Pet | null, gameStarted: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pet, gameStarted }));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
};

export const useGameState = () => {
  const savedGame = loadSavedGame();
  const [pet, setPet] = useState<Pet | null>(savedGame.pet);
  const [gameStarted, setGameStarted] = useState(savedGame.gameStarted);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const lastLevelRef = useRef(pet?.level ?? 1);
  const lastEvolutionCountRef = useRef(pet?.evolutionCount ?? 0);

  // Save game whenever pet changes
  useEffect(() => {
    saveGame(pet, gameStarted);
  }, [pet, gameStarted]);

  // Check for level up
  useEffect(() => {
    if (pet && pet.level > lastLevelRef.current) {
      setShowLevelUp(true);
      lastLevelRef.current = pet.level;
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [pet?.level, pet]);

  // Check for evolution (every 100 levels)
  useEffect(() => {
    if (pet) {
      const currentEvolutionCount = getEvolutionCount(pet.level);
      if (currentEvolutionCount > lastEvolutionCountRef.current) {
        setShowEvolution(true);
        lastEvolutionCountRef.current = currentEvolutionCount;
        setTimeout(() => setShowEvolution(false), 3000);
      }
    }
  }, [pet?.level, pet]);

  // Process XP and level up
  const processXpGain = useCallback((currentPet: Pet, baseXp: number): Pet => {
    const xpMultiplier = getXpMultiplier(currentPet.upgrades);
    const xpGain = Math.floor(baseXp * xpMultiplier);
    let newXp = currentPet.xp + xpGain;
    let newLevel = currentPet.level;
    let newCoins = currentPet.coins;
    let newEvolutionCount = currentPet.evolutionCount;

    // Check for level ups (no cap, max 10 levels at once for safety)
    const maxLevelsPerAction = 10;
    let levelsGained = 0;
    while (newXp >= getXpForLevel(newLevel) && levelsGained < maxLevelsPerAction) {
      newXp -= getXpForLevel(newLevel);
      newLevel++;
      levelsGained++;
      
      // Award coins on level up
      const coinMultiplier = getCoinMultiplier(currentPet.upgrades);
      newCoins += Math.floor(getCoinsForLevel(newLevel) * coinMultiplier);

      // Check for evolution (every 100 levels)
      const currentEvolutions = getEvolutionCount(newLevel);
      if (currentEvolutions > newEvolutionCount) {
        newEvolutionCount = currentEvolutions;
      }
    }

    return {
      ...currentPet,
      xp: newXp,
      level: newLevel,
      coins: newCoins,
      evolutionCount: newEvolutionCount,
    };
  }, []);

  // Initialize pet with selected character
  const startGame = useCallback((character: BrainRotCharacter) => {
    // Check if there's already a saved pet
    const saved = loadSavedGame();
    if (saved.pet && saved.gameStarted) {
      // Restore existing pet
      setPet(saved.pet);
      setGameStarted(true);
      return;
    }

    const initialStats: PetStats = {
      hunger: 80,
      happiness: 80,
      energy: 80,
      hygiene: 80,
    };

    const initialAttributes: Attributes = {
      speed: 0,
      wisdom: 0,
      strength: 0,
      clarity: 0,
    };

    const newPet: Pet = {
      character,
      stats: initialStats,
      attributes: initialAttributes,
      mood: 'happy',
      age: 0,
      isAlive: true,
      lastUpdated: Date.now(),
      xp: 0,
      level: 1,
      coins: 0,
      totalClicks: 0,
      evolutionCount: 0,
      upgrades: [],
      inventory: [],
      equipped: {},
      unlockedAreas: ['scrapyard_1', 'forest_1', 'mountain_1', 'ocean_1'],
      areaProgress: {},
    };

    setPet(newPet);
    setGameStarted(true);
  }, []);

  // Decay stats over time
  useEffect(() => {
    if (!pet || !pet.isAlive) return;

    const interval = setInterval(() => {
      setPet((prevPet) => {
        if (!prevPet || !prevPet.isAlive) return prevPet;

        const newStats: PetStats = {
          hunger: Math.max(0, prevPet.stats.hunger - DECAY_AMOUNT),
          happiness: Math.max(0, prevPet.stats.happiness - (DECAY_AMOUNT * 0.5)),
          energy: Math.max(0, prevPet.stats.energy - (DECAY_AMOUNT * 0.7)),
          hygiene: Math.max(0, prevPet.stats.hygiene - (DECAY_AMOUNT * 0.3)),
        };

        const isAlive = checkIfAlive(newStats);
        const mood = calculateMood(newStats, isAlive);

        return {
          ...prevPet,
          stats: newStats,
          mood,
          isAlive,
          age: prevPet.age + (DECAY_INTERVAL / 60000), // Convert to minutes
          lastUpdated: Date.now(),
        };
      });
    }, DECAY_INTERVAL);

    return () => clearInterval(interval);
  }, [pet?.isAlive]);

  // Auto caretaker effect (runs every 10 seconds, boosts ALL stats)
  useEffect(() => {
    if (!pet || !pet.isAlive) return;

    const interval = setInterval(() => {
      setPet((prevPet) => {
        if (!prevPet || !prevPet.isAlive) return prevPet;

        const autoCaretakerLevel = getUpgradeLevel(prevPet.upgrades, 'autoCaretaker');
        if (autoCaretakerLevel === 0) return prevPet;

        // Apply auto effects - ALL stats get +10 per level every 10 seconds
        const statBoost = AUTO_CARETAKER_STAT_BOOST * autoCaretakerLevel;
        const newStats: PetStats = {
          hunger: Math.min(100, prevPet.stats.hunger + statBoost),
          happiness: Math.min(100, prevPet.stats.happiness + statBoost),
          energy: Math.min(100, prevPet.stats.energy + statBoost),
          hygiene: Math.min(100, prevPet.stats.hygiene + statBoost),
        };

        const isAlive = checkIfAlive(newStats);
        const mood = calculateMood(newStats, isAlive);

        // Add XP for auto actions
        let updatedPet = {
          ...prevPet,
          stats: newStats,
          mood,
          isAlive,
        };

        updatedPet = processXpGain(updatedPet, autoCaretakerLevel * 5);

        return updatedPet;
      });
    }, AUTO_CARETAKER_INTERVAL);

    return () => clearInterval(interval);
  }, [pet?.isAlive, processXpGain]);

  // Action: Feed the pet (gains Strength attribute)
  const feedPet = useCallback(() => {
    if (!pet || !pet.isAlive) return;

    setPet((prevPet) => {
      if (!prevPet) return null;
      
      const multiplier = getStatMultiplier(prevPet.upgrades);
      const newStats = {
        ...prevPet.stats,
        hunger: Math.min(100, prevPet.stats.hunger + Math.floor(25 * multiplier)),
        happiness: Math.min(100, prevPet.stats.happiness + Math.floor(5 * multiplier)),
      };

      // Gain Strength attribute
      const newAttributes = {
        ...prevPet.attributes,
        strength: prevPet.attributes.strength + 1,
      };

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        attributes: newAttributes,
        mood: 'eating' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP (scales with level)
      const baseXp = getBaseXpForAction(prevPet.level);
      updatedPet = processXpGain(updatedPet, baseXp);

      return updatedPet;
    });

    // Reset mood after animation
    setTimeout(() => {
      setPet((prevPet) => {
        if (!prevPet) return null;
        return {
          ...prevPet,
          mood: calculateMood(prevPet.stats, prevPet.isAlive),
        };
      });
    }, 1500);
  }, [pet, processXpGain]);

  // Action: Play with the pet (gains Speed attribute)
  const playWithPet = useCallback(() => {
    if (!pet || !pet.isAlive) return;

    setPet((prevPet) => {
      if (!prevPet) return null;
      
      const multiplier = getStatMultiplier(prevPet.upgrades);
      const newStats = {
        ...prevPet.stats,
        happiness: Math.min(100, prevPet.stats.happiness + Math.floor(20 * multiplier)),
        energy: Math.max(0, prevPet.stats.energy - 10),
        hunger: Math.max(0, prevPet.stats.hunger - 5),
      };

      // Gain Speed attribute
      const newAttributes = {
        ...prevPet.attributes,
        speed: prevPet.attributes.speed + 1,
      };

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        attributes: newAttributes,
        mood: 'playing' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP (scales with level)
      const baseXp = getBaseXpForAction(prevPet.level);
      updatedPet = processXpGain(updatedPet, baseXp);

      return updatedPet;
    });

    setTimeout(() => {
      setPet((prevPet) => {
        if (!prevPet) return null;
        return {
          ...prevPet,
          mood: calculateMood(prevPet.stats, prevPet.isAlive),
        };
      });
    }, 1500);
  }, [pet, processXpGain]);

  // Action: Put pet to sleep (gains Wisdom attribute)
  const sleepPet = useCallback(() => {
    if (!pet || !pet.isAlive) return;

    setPet((prevPet) => {
      if (!prevPet) return null;
      
      const multiplier = getStatMultiplier(prevPet.upgrades);
      const newStats = {
        ...prevPet.stats,
        energy: Math.min(100, prevPet.stats.energy + Math.floor(30 * multiplier)),
        hunger: Math.max(0, prevPet.stats.hunger - 5),
      };

      // Gain Wisdom attribute
      const newAttributes = {
        ...prevPet.attributes,
        wisdom: prevPet.attributes.wisdom + 1,
      };

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        attributes: newAttributes,
        mood: 'sleeping' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP (scales with level)
      const baseXp = getBaseXpForAction(prevPet.level);
      updatedPet = processXpGain(updatedPet, baseXp);

      return updatedPet;
    });

    setTimeout(() => {
      setPet((prevPet) => {
        if (!prevPet) return null;
        return {
          ...prevPet,
          mood: calculateMood(prevPet.stats, prevPet.isAlive),
        };
      });
    }, 2000);
  }, [pet, processXpGain]);

  // Action: Clean the pet (gains Clarity attribute)
  const cleanPet = useCallback(() => {
    if (!pet || !pet.isAlive) return;

    setPet((prevPet) => {
      if (!prevPet) return null;
      
      const multiplier = getStatMultiplier(prevPet.upgrades);
      const newStats = {
        ...prevPet.stats,
        hygiene: Math.min(100, prevPet.stats.hygiene + Math.floor(35 * multiplier)),
        happiness: Math.min(100, prevPet.stats.happiness + Math.floor(5 * multiplier)),
      };

      // Gain Clarity attribute
      const newAttributes = {
        ...prevPet.attributes,
        clarity: prevPet.attributes.clarity + 1,
      };

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        attributes: newAttributes,
        mood: calculateMood(newStats, prevPet.isAlive),
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP (scales with level)
      const baseXp = getBaseXpForAction(prevPet.level);
      updatedPet = processXpGain(updatedPet, baseXp);

      return updatedPet;
    });
  }, [pet, processXpGain]);

  // Purchase upgrade
  const purchaseUpgrade = useCallback((upgradeId: UpgradeId) => {
    if (!pet) return;

    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const currentLevel = getUpgradeLevel(pet.upgrades, upgradeId);
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = getUpgradeCost(upgrade, currentLevel);
    if (pet.coins < cost) return;

    setPet((prevPet) => {
      if (!prevPet) return null;

      const existingUpgrade = prevPet.upgrades.find(u => u.id === upgradeId);
      let newUpgrades: OwnedUpgrade[];

      if (existingUpgrade) {
        newUpgrades = prevPet.upgrades.map(u =>
          u.id === upgradeId ? { ...u, level: u.level + 1 } : u
        );
      } else {
        newUpgrades = [...prevPet.upgrades, { id: upgradeId, level: 1 }];
      }

      return {
        ...prevPet,
        coins: prevPet.coins - cost,
        upgrades: newUpgrades,
      };
    });
  }, [pet]);

  // Equip an item
  const equipItem = useCallback((equipment: Equipment) => {
    if (!pet) return;

    setPet((prevPet) => {
      if (!prevPet) return null;

      const newEquipped = { ...prevPet.equipped };
      newEquipped[equipment.slot] = equipment;

      return {
        ...prevPet,
        equipped: newEquipped,
      };
    });
  }, [pet]);

  // Unequip an item
  const unequipItem = useCallback((slot: Equipment['slot']) => {
    if (!pet) return;

    setPet((prevPet) => {
      if (!prevPet) return null;

      const newEquipped = { ...prevPet.equipped };
      delete newEquipped[slot];

      return {
        ...prevPet,
        equipped: newEquipped,
      };
    });
  }, [pet]);

  // Get available areas
  const getAvailableAreas = useCallback((): Area[] => {
    if (!pet) return [];
    return AREAS.filter(area => 
      pet.level >= area.requiredLevel && isAreaUnlocked(area, pet)
    );
  }, [pet]);

  // Complete minigame and process rewards
  const processMinigameResult = useCallback((area: Area, result: MinigameResult) => {
    if (!pet || !result.success) return;

    setPet((prevPet) => {
      if (!prevPet) return null;

      let updatedPet = { ...prevPet };

      // Award XP and coins
      if (result.rewards) {
        updatedPet = processXpGain(updatedPet, result.rewards.xp);
        updatedPet.coins += result.rewards.coins;

        // Add equipment to inventory if rewarded
        if (result.rewards.equipment) {
          updatedPet.inventory = [...updatedPet.inventory, result.rewards.equipment];
        }
      }

      // Update area progress
      const currentProgress = updatedPet.areaProgress[area.id] || 0;
      if (result.wavesCompleted > currentProgress) {
        updatedPet.areaProgress = {
          ...updatedPet.areaProgress,
          [area.id]: result.wavesCompleted,
        };

        // Check if we should unlock new areas
        if (result.wavesCompleted >= 5) {
          const newUnlocks = AREAS.filter(a => 
            a.unlockRequirement?.areaId === area.id &&
            a.unlockRequirement.levelRequired <= result.wavesCompleted &&
            !updatedPet.unlockedAreas.includes(a.id)
          ).map(a => a.id);

          if (newUnlocks.length > 0) {
            updatedPet.unlockedAreas = [...updatedPet.unlockedAreas, ...newUnlocks];
          }
        }
      }

      return updatedPet;
    });
  }, [pet, processXpGain]);

  // Reset game
  const resetGame = useCallback(() => {
    setPet(null);
    setGameStarted(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if there's a saved game
  const hasSavedGame = useCallback((): boolean => {
    const saved = loadSavedGame();
    return saved.pet !== null && saved.gameStarted;
  }, []);

  // Continue saved game
  const continueSavedGame = useCallback(() => {
    const saved = loadSavedGame();
    if (saved.pet && saved.gameStarted) {
      setPet(saved.pet);
      setGameStarted(true);
    }
  }, []);

  return {
    pet,
    gameStarted,
    showLevelUp,
    showEvolution,
    startGame,
    feedPet,
    playWithPet,
    sleepPet,
    cleanPet,
    resetGame,
    purchaseUpgrade,
    hasSavedGame,
    continueSavedGame,
    equipItem,
    unequipItem,
    getAvailableAreas,
    processMinigameResult,
    getRandomEquipment,
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Pet, PetStats, PetMood, BrainRotCharacter, UpgradeId, OwnedUpgrade } from '../types/pet';
import { getXpForLevel, getCoinsForLevel, EVOLUTION_LEVEL, UPGRADES, getUpgradeCost } from '../types/pet';

const STORAGE_KEY = 'brainrot-tamagotchi-save';
const DECAY_INTERVAL = 3000; // Stats decay every 3 seconds
const DECAY_AMOUNT = 2;      // Amount stats decay
const AUTO_INTERVAL = 60000; // Auto upgrades tick every 60 seconds
const BASE_XP_PER_ACTION = 10;

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

// Load saved game from localStorage
const loadSavedGame = (): { pet: Pet | null; gameStarted: boolean } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        pet: data.pet,
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

  // Process XP and level up
  const processXpGain = (currentPet: Pet, baseXp: number): Pet => {
    const xpMultiplier = getXpMultiplier(currentPet.upgrades);
    const xpGain = Math.floor(baseXp * xpMultiplier);
    let newXp = currentPet.xp + xpGain;
    let newLevel = currentPet.level;
    let newCoins = currentPet.coins;
    let newEvolved = currentPet.isEvolved;

    // Check for level ups (max 10 levels at once for safety)
    const maxLevelsPerAction = 10;
    let levelsGained = 0;
    while (newXp >= getXpForLevel(newLevel) && levelsGained < maxLevelsPerAction) {
      newXp -= getXpForLevel(newLevel);
      newLevel++;
      levelsGained++;
      
      // Award coins on level up
      const coinMultiplier = getCoinMultiplier(currentPet.upgrades);
      newCoins += Math.floor(getCoinsForLevel(newLevel) * coinMultiplier);

      // Check for evolution
      if (newLevel >= EVOLUTION_LEVEL && !newEvolved) {
        newEvolved = true;
        setShowEvolution(true);
        setTimeout(() => setShowEvolution(false), 3000);
      }
    }

    return {
      ...currentPet,
      xp: newXp,
      level: newLevel,
      coins: newCoins,
      isEvolved: newEvolved,
    };
  };

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

    const newPet: Pet = {
      character,
      stats: initialStats,
      mood: 'happy',
      age: 0,
      isAlive: true,
      lastUpdated: Date.now(),
      xp: 0,
      level: 1,
      coins: 0,
      totalClicks: 0,
      isEvolved: false,
      upgrades: [],
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

  // Auto upgrade effects (run every minute)
  useEffect(() => {
    if (!pet || !pet.isAlive) return;

    const interval = setInterval(() => {
      setPet((prevPet) => {
        if (!prevPet || !prevPet.isAlive) return prevPet;

        const autoFeederLevel = getUpgradeLevel(prevPet.upgrades, 'autoFeeder');
        const autoPlayerLevel = getUpgradeLevel(prevPet.upgrades, 'autoPlayer');
        const autoRestLevel = getUpgradeLevel(prevPet.upgrades, 'autoRest');
        const autoCleanerLevel = getUpgradeLevel(prevPet.upgrades, 'autoCleaner');

        // Apply auto effects
        const newStats: PetStats = {
          hunger: Math.min(100, prevPet.stats.hunger + (autoFeederLevel * 5)),
          happiness: Math.min(100, prevPet.stats.happiness + (autoPlayerLevel * 5)),
          energy: Math.min(100, prevPet.stats.energy + (autoRestLevel * 5)),
          hygiene: Math.min(100, prevPet.stats.hygiene + (autoCleanerLevel * 5)),
        };

        const isAlive = checkIfAlive(newStats);
        const mood = calculateMood(newStats, isAlive);

        // Add XP for auto actions if any auto upgrade is active
        const totalAutoLevels = autoFeederLevel + autoPlayerLevel + autoRestLevel + autoCleanerLevel;
        let updatedPet = {
          ...prevPet,
          stats: newStats,
          mood,
          isAlive,
        };

        if (totalAutoLevels > 0) {
          updatedPet = processXpGain(updatedPet, totalAutoLevels * 2);
        }

        return updatedPet;
      });
    }, AUTO_INTERVAL);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.isAlive]);

  // Action: Feed the pet
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

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        mood: 'eating' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP
      updatedPet = processXpGain(updatedPet, BASE_XP_PER_ACTION);

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
  }, [pet]);

  // Action: Play with the pet
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

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        mood: 'playing' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP
      updatedPet = processXpGain(updatedPet, BASE_XP_PER_ACTION);

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
  }, [pet]);

  // Action: Put pet to sleep
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

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        mood: 'sleeping' as PetMood,
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP
      updatedPet = processXpGain(updatedPet, BASE_XP_PER_ACTION);

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
  }, [pet]);

  // Action: Clean the pet
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

      let updatedPet: Pet = {
        ...prevPet,
        stats: newStats,
        mood: calculateMood(newStats, prevPet.isAlive),
        totalClicks: prevPet.totalClicks + 1,
      };

      // Add XP
      updatedPet = processXpGain(updatedPet, BASE_XP_PER_ACTION);

      return updatedPet;
    });
  }, [pet]);

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
  };
};

import { useState, useEffect, useCallback } from 'react';
import type { Pet, PetStats, PetMood, BrainRotCharacter } from '../types/pet';

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

export const useGameState = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize pet with selected character
  const startGame = useCallback((character: BrainRotCharacter) => {
    const initialStats: PetStats = {
      hunger: 80,
      happiness: 80,
      energy: 80,
      hygiene: 80,
    };

    setPet({
      character,
      stats: initialStats,
      mood: 'happy',
      age: 0,
      isAlive: true,
      lastUpdated: Date.now(),
    });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only restart interval when alive status changes
  }, [pet?.isAlive]);

  // Action: Feed the pet
  const feedPet = useCallback(() => {
    if (!pet || !pet.isAlive) return;

    setPet((prevPet) => {
      if (!prevPet) return null;
      
      const newStats = {
        ...prevPet.stats,
        hunger: Math.min(100, prevPet.stats.hunger + 25),
        happiness: Math.min(100, prevPet.stats.happiness + 5),
      };

      return {
        ...prevPet,
        stats: newStats,
        mood: 'eating' as PetMood,
      };
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
      
      const newStats = {
        ...prevPet.stats,
        happiness: Math.min(100, prevPet.stats.happiness + 20),
        energy: Math.max(0, prevPet.stats.energy - 10),
        hunger: Math.max(0, prevPet.stats.hunger - 5),
      };

      return {
        ...prevPet,
        stats: newStats,
        mood: 'playing' as PetMood,
      };
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
      
      const newStats = {
        ...prevPet.stats,
        energy: Math.min(100, prevPet.stats.energy + 30),
        hunger: Math.max(0, prevPet.stats.hunger - 5),
      };

      return {
        ...prevPet,
        stats: newStats,
        mood: 'sleeping' as PetMood,
      };
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
      
      const newStats = {
        ...prevPet.stats,
        hygiene: Math.min(100, prevPet.stats.hygiene + 35),
        happiness: Math.min(100, prevPet.stats.happiness + 5),
      };

      return {
        ...prevPet,
        stats: newStats,
        mood: calculateMood(newStats, prevPet.isAlive),
      };
    });
  }, [pet]);

  // Reset game
  const resetGame = useCallback(() => {
    setPet(null);
    setGameStarted(false);
  }, []);

  return {
    pet,
    gameStarted,
    startGame,
    feedPet,
    playWithPet,
    sleepPet,
    cleanPet,
    resetGame,
  };
};

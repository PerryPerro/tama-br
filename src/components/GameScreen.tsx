import type { Pet } from '../types/pet';
import { PetDisplay } from './PetDisplay';
import { StatsDisplay } from './StatsDisplay';
import { ActionButtons } from './ActionButtons';
import './GameScreen.css';

interface GameScreenProps {
  pet: Pet;
  onFeed: () => void;
  onPlay: () => void;
  onSleep: () => void;
  onClean: () => void;
  onReset: () => void;
}

export const GameScreen = ({
  pet,
  onFeed,
  onPlay,
  onSleep,
  onClean,
  onReset,
}: GameScreenProps) => {
  return (
    <div className="game-screen">
      <div className="game-header">
        <h1 className="game-title">🇮🇹 Brain Rot Tamagotchi 🇮🇹</h1>
        <button className="reset-btn" onClick={onReset}>
          🔄 New Pet
        </button>
      </div>

      <PetDisplay pet={pet} />

      {pet.isAlive ? (
        <>
          <StatsDisplay stats={pet.stats} />
          <ActionButtons
            onFeed={onFeed}
            onPlay={onPlay}
            onSleep={onSleep}
            onClean={onClean}
          />
        </>
      ) : (
        <button className="restart-btn" onClick={onReset}>
          🔄 Try Again
        </button>
      )}
    </div>
  );
};

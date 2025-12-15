import type { Pet, PetMood } from '../types/pet';
import './PetDisplay.css';

interface PetDisplayProps {
  pet: Pet;
}

const getMoodAnimation = (mood: PetMood): string => {
  switch (mood) {
    case 'happy': return 'bounce';
    case 'playing': return 'spin';
    case 'eating': return 'munch';
    case 'sleeping': return 'sleep';
    case 'sad': return 'shake';
    case 'dirty': return 'wobble';
    case 'dead': return 'none';
    default: return 'idle';
  }
};

const getMoodIndicator = (mood: PetMood): string => {
  switch (mood) {
    case 'happy': return '✨';
    case 'playing': return '🎮';
    case 'eating': return '🍕';
    case 'sleeping': return '💤';
    case 'sad': return '😢';
    case 'dirty': return '🦠';
    case 'dead': return '👻';
    default: return '';
  }
};

export const PetDisplay = ({ pet }: PetDisplayProps) => {
  const animation = getMoodAnimation(pet.mood);
  const moodIndicator = getMoodIndicator(pet.mood);
  
  // Use evolved emoji/image if evolved
  const displayEmoji = pet.isEvolved ? pet.character.evolvedEmoji : pet.character.emoji;
  const displayCatchphrase = pet.isEvolved ? pet.character.evolvedCatchphrase : pet.character.catchphrase;

  return (
    <div className="pet-display">
      <div className="pet-name-container">
        <span className="pet-italian-name" style={{ color: pet.character.color }}>
          {pet.isEvolved && <span className="evolved-prefix">✨ </span>}
          {pet.character.italianName}
          {pet.isEvolved && <span className="evolved-suffix"> ✨</span>}
        </span>
        <span className="pet-age">Age: {Math.floor(pet.age)} min</span>
      </div>
      
      <div 
        className={`pet-container ${animation} ${pet.isEvolved ? 'evolved' : ''}`}
        style={{ '--pet-color': pet.character.color } as React.CSSProperties}
      >
        <div className="pet-emoji">
          {pet.isAlive ? displayEmoji : '💀'}
        </div>
        <div className="mood-indicator">{moodIndicator}</div>
        {pet.isEvolved && <div className="evolution-glow" />}
      </div>

      {pet.isAlive && (
        <div className="catchphrase">
          {displayCatchphrase}
        </div>
      )}

      {!pet.isAlive && (
        <div className="death-message">
          Your {pet.character.italianName} has departed... 
          <br />
          <span className="rip">R.I.P. 🪦</span>
        </div>
      )}
    </div>
  );
};

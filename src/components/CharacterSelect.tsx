import type { BrainRotCharacter } from '../types/pet';
import { BRAIN_ROT_CHARACTERS } from '../types/pet';
import './CharacterSelect.css';

interface CharacterSelectProps {
  onSelect: (character: BrainRotCharacter) => void;
  hasSavedGame?: boolean;
  onContinue?: () => void;
}

export const CharacterSelect = ({ onSelect, hasSavedGame, onContinue }: CharacterSelectProps) => {
  return (
    <div className="character-select">
      <h1 className="title">🇮🇹 Italian Brain Rot 🇮🇹</h1>
      <h2 className="subtitle">Tamagotchi</h2>
      
      {hasSavedGame && onContinue && (
        <div className="saved-game-section">
          <button className="continue-btn" onClick={onContinue}>
            ▶️ Continue Saved Game
          </button>
          <div className="or-divider">
            <span>or start new</span>
          </div>
        </div>
      )}
      
      <p className="instruction">Choose your creature!</p>
      
      <div className="character-grid">
        {BRAIN_ROT_CHARACTERS.map((character) => (
          <button
            key={character.id}
            className="character-card"
            style={{ '--character-color': character.color } as React.CSSProperties}
            onClick={() => onSelect(character)}
          >
            <span className="character-emoji">{character.emoji}</span>
            <span className="character-italian-name">{character.italianName}</span>
            <span className="character-name">{character.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

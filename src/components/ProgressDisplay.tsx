import type { Pet } from '../types/pet';
import { getXpForLevel, EVOLUTION_INTERVAL, getEvolutionTitle } from '../types/pet';
import './ProgressDisplay.css';

interface ProgressDisplayProps {
  pet: Pet;
}

export const ProgressDisplay = ({ pet }: ProgressDisplayProps) => {
  const xpNeeded = getXpForLevel(pet.level);
  const xpProgress = (pet.xp / xpNeeded) * 100;
  const evolutionTitle = getEvolutionTitle(pet.evolutionCount);

  return (
    <div className="progress-display">
      <div className="progress-row">
        <div className="level-badge">
          <span className="level-icon">{pet.evolutionCount > 0 ? '👑' : '⭐'}</span>
          <span className="level-number">Lv.{pet.level}</span>
        </div>
        
        <div className="xp-container">
          <div className="xp-bar-bg">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <span className="xp-text">{pet.xp}/{xpNeeded} XP</span>
        </div>
        
        <div className="coins-display">
          <span className="coins-icon">🪙</span>
          <span className="coins-amount">{pet.coins}</span>
        </div>
      </div>

      <div className="stats-row">
        <span className="stat-item">
          <span className="stat-emoji">👆</span>
          <span className="stat-num">{pet.totalClicks}</span>
          <span className="stat-label">clicks</span>
        </span>
        
        <span className="stat-item evolution-progress">
          <span className="stat-emoji">🦋</span>
          <span className="stat-num">{pet.level % EVOLUTION_INTERVAL}/{EVOLUTION_INTERVAL}</span>
          <span className="stat-label">to evolve</span>
        </span>
        
        {pet.evolutionCount > 0 && (
          <span className="stat-item evolved-badge">
            <span className="evolved-text">✨ {evolutionTitle} x{pet.evolutionCount} ✨</span>
          </span>
        )}
      </div>

      <div className="attributes-row">
        <span className="attribute-item" title="Speed (from Play)">
          <span className="attr-icon">⚡</span>
          <span className="attr-value">{pet.attributes.speed}</span>
        </span>
        <span className="attribute-item" title="Wisdom (from Sleep)">
          <span className="attr-icon">🧠</span>
          <span className="attr-value">{pet.attributes.wisdom}</span>
        </span>
        <span className="attribute-item" title="Strength (from Feed)">
          <span className="attr-icon">💪</span>
          <span className="attr-value">{pet.attributes.strength}</span>
        </span>
        <span className="attribute-item" title="Clarity (from Clean)">
          <span className="attr-icon">✨</span>
          <span className="attr-value">{pet.attributes.clarity}</span>
        </span>
      </div>
    </div>
  );
};

import type { Pet } from '../types/pet';
import { getXpForLevel, EVOLUTION_LEVEL } from '../types/pet';
import './ProgressDisplay.css';

interface ProgressDisplayProps {
  pet: Pet;
}

export const ProgressDisplay = ({ pet }: ProgressDisplayProps) => {
  const xpNeeded = getXpForLevel(pet.level);
  const xpProgress = (pet.xp / xpNeeded) * 100;

  return (
    <div className="progress-display">
      <div className="progress-row">
        <div className="level-badge">
          <span className="level-icon">{pet.isEvolved ? '👑' : '⭐'}</span>
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
        
        {!pet.isEvolved && (
          <span className="stat-item evolution-progress">
            <span className="stat-emoji">🦋</span>
            <span className="stat-num">{pet.level}/{EVOLUTION_LEVEL}</span>
            <span className="stat-label">to evolve</span>
          </span>
        )}
        
        {pet.isEvolved && (
          <span className="stat-item evolved-badge">
            <span className="evolved-text">✨ EVOLVED ✨</span>
          </span>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import type { Pet, Area, MinigameResult } from '../types/pet';
import { AREAS, isAreaUnlocked } from '../types/pet';
import { Minigame } from './Minigame';
import './Adventure.css';

interface AdventureProps {
  pet: Pet;
  onMinigameComplete: (area: Area, result: MinigameResult) => void;
  onClose: () => void;
}

export const Adventure = ({ pet, onMinigameComplete, onClose }: AdventureProps) => {
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  const getAreasByType = () => {
    const grouped: Record<string, Area[]> = {
      scrapyard: [],
      forest: [],
      mountain: [],
      ocean: [],
    };

    AREAS.forEach(area => {
      grouped[area.type].push(area);
    });

    return grouped;
  };

  const areaGroups = getAreasByType();

  const getAreaTypeInfo = (type: string) => {
    const info: Record<string, { name: string; icon: string; color: string; weakness: string }> = {
      scrapyard: { name: 'Robot Areas', icon: '🤖', color: '#6bcb77', weakness: 'Clarity' },
      forest: { name: 'Forest Areas', icon: '🌲', color: '#4cb84c', weakness: 'Speed' },
      mountain: { name: 'Mountain Areas', icon: '⛰️', color: '#888', weakness: 'Strength' },
      ocean: { name: 'Ocean Areas', icon: '🌊', color: '#4d96ff', weakness: 'Wisdom' },
    };
    return info[type] || { name: type, icon: '❓', color: '#888', weakness: 'Unknown' };
  };

  const isLocked = (area: Area): boolean => {
    if (pet.level < area.requiredLevel) return true;
    return !isAreaUnlocked(area, pet);
  };

  const getProgress = (area: Area): number => {
    return pet.areaProgress[area.id] || 0;
  };

  const handleAreaClick = (area: Area) => {
    if (isLocked(area)) return;
    setSelectedArea(area);
  };

  const handleMinigameComplete = (result: MinigameResult) => {
    if (selectedArea) {
      onMinigameComplete(selectedArea, result);
    }
    setSelectedArea(null);
  };

  if (selectedArea) {
    return (
      <Minigame
        pet={pet}
        area={selectedArea}
        onComplete={handleMinigameComplete}
        onClose={() => setSelectedArea(null)}
      />
    );
  }

  return (
    <div className="adventure-overlay" onClick={onClose}>
      <div className="adventure-container" onClick={e => e.stopPropagation()}>
        <div className="adventure-header">
          <h2 className="adventure-title">🗺️ Adventure Areas</h2>
          <button className="adventure-close" onClick={onClose}>✕</button>
        </div>

        <div className="areas-grid">
          {Object.entries(areaGroups).map(([type, areas]) => {
            const typeInfo = getAreaTypeInfo(type);
            return (
              <div key={type} className="area-group">
                <div className="area-group-header" style={{ borderColor: typeInfo.color }}>
                  <span className="group-icon">{typeInfo.icon}</span>
                  <span className="group-name">{typeInfo.name}</span>
                  <span className="group-weakness" style={{ color: typeInfo.color }}>
                    Weak vs {typeInfo.weakness}
                  </span>
                </div>
                
                <div className="area-list">
                  {areas.map(area => {
                    const locked = isLocked(area);
                    const progress = getProgress(area);
                    
                    return (
                      <div
                        key={area.id}
                        className={`area-card ${locked ? 'locked' : ''}`}
                        onClick={() => handleAreaClick(area)}
                      >
                        <div className="area-icon">{locked ? '🔒' : area.icon}</div>
                        <div className="area-info">
                          <span className="area-name">{area.name}</span>
                          {!locked && (
                            <span className="area-progress">
                              Best: Wave {progress}/5
                            </span>
                          )}
                          {locked && area.unlockRequirement && (
                            <span className="unlock-req">
                              Complete Wave 5 in starter area
                            </span>
                          )}
                          {locked && !area.unlockRequirement && (
                            <span className="unlock-req">
                              Requires Level {area.requiredLevel}
                            </span>
                          )}
                        </div>
                        <div className="area-difficulty">
                          {'⭐'.repeat(Math.ceil(area.difficulty / 2))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="adventure-footer">
          <p>Defeat waves of monsters in 30 seconds to earn rewards!</p>
          <p className="tip">💡 Build attributes that counter each area's weakness.</p>
        </div>
      </div>
    </div>
  );
};

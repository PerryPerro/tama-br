import type { PetStats } from '../types/pet';
import './StatsDisplay.css';

interface StatsDisplayProps {
  stats: PetStats;
}

const StatBar = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => {
  return (
    <div className="stat-bar">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
        <span className="stat-value">{Math.round(value)}%</span>
      </div>
      <div className="stat-bar-bg">
        <div 
          className="stat-bar-fill" 
          style={{ 
            width: `${value}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        />
      </div>
    </div>
  );
};

export const StatsDisplay = ({ stats }: StatsDisplayProps) => {
  return (
    <div className="stats-display">
      <StatBar label="Hunger" value={stats.hunger} icon="🍕" color="#ff6b6b" />
      <StatBar label="Happiness" value={stats.happiness} icon="😊" color="#ffd93d" />
      <StatBar label="Energy" value={stats.energy} icon="⚡" color="#6bcb77" />
      <StatBar label="Hygiene" value={stats.hygiene} icon="🧼" color="#4d96ff" />
    </div>
  );
};

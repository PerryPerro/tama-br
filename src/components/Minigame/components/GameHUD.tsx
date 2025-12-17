interface GameHUDProps {
  level: number;
  maxLevel: number;
  timeLeft: number;
  score: number;
  onCancel: () => void;
}

export const GameHUD = ({ level, maxLevel, timeLeft, score, onCancel }: GameHUDProps) => {
  return (
    <div className="game-hud">
      <span className="wave-indicator">Level {level}/{maxLevel}</span>
      <span className="time-indicator">⏱️ {timeLeft}s</span>
      <span className="score-indicator">Score: {score}</span>
      <button className="cancel-game-btn" onClick={onCancel} title="Cancel and exit">
        ❌
      </button>
    </div>
  );
};

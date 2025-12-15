import './ActionButtons.css';

interface ActionButtonsProps {
  onFeed: () => void;
  onPlay: () => void;
  onSleep: () => void;
  onClean: () => void;
  disabled?: boolean;
}

export const ActionButtons = ({ onFeed, onPlay, onSleep, onClean, disabled }: ActionButtonsProps) => {
  return (
    <div className="action-buttons">
      <button 
        className="action-btn feed" 
        onClick={onFeed}
        disabled={disabled}
        title="Feed your pet"
      >
        <span className="btn-icon">🍕</span>
        <span className="btn-label">Feed</span>
      </button>
      
      <button 
        className="action-btn play" 
        onClick={onPlay}
        disabled={disabled}
        title="Play with your pet"
      >
        <span className="btn-icon">🎮</span>
        <span className="btn-label">Play</span>
      </button>
      
      <button 
        className="action-btn sleep" 
        onClick={onSleep}
        disabled={disabled}
        title="Put your pet to sleep"
      >
        <span className="btn-icon">💤</span>
        <span className="btn-label">Sleep</span>
      </button>
      
      <button 
        className="action-btn clean" 
        onClick={onClean}
        disabled={disabled}
        title="Clean your pet"
      >
        <span className="btn-icon">🧼</span>
        <span className="btn-label">Clean</span>
      </button>
    </div>
  );
};

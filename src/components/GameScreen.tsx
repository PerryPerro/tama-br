import { useState } from 'react';
import type { Pet, UpgradeId, Equipment, EquipmentSlot, Area, MinigameResult } from '../types/pet';
import { PetDisplay } from './PetDisplay';
import { StatsDisplay } from './StatsDisplay';
import { ActionButtons } from './ActionButtons';
import { ProgressDisplay } from './ProgressDisplay';
import { Shop } from './Shop';
import { Adventure } from './Adventure';
import { Inventory } from './Inventory';
import './GameScreen.css';

interface GameScreenProps {
  pet: Pet;
  showLevelUp: boolean;
  showEvolution: boolean;
  onFeed: () => void;
  onPlay: () => void;
  onSleep: () => void;
  onClean: () => void;
  onReset: () => void;
  onPurchaseUpgrade: (upgradeId: UpgradeId) => void;
  onEquipItem: (equipment: Equipment) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onMinigameComplete: (area: Area, result: MinigameResult) => void;
}

export const GameScreen = ({
  pet,
  showLevelUp,
  showEvolution,
  onFeed,
  onPlay,
  onSleep,
  onClean,
  onReset,
  onPurchaseUpgrade,
  onEquipItem,
  onUnequipItem,
  onMinigameComplete,
}: GameScreenProps) => {
  const [showShop, setShowShop] = useState(false);
  const [showAdventure, setShowAdventure] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  return (
    <div className="game-screen">
      {showLevelUp && (
        <div className="level-up-popup">
          <span className="level-up-text">⬆️ LEVEL UP! ⬆️</span>
          <span className="level-up-number">Level {pet.level}</span>
        </div>
      )}

      {showEvolution && (
        <div className="evolution-popup">
          <span className="evolution-text">🌟 EVOLUTION! 🌟</span>
          <span className="evolution-name">{pet.character.italianName} has evolved!</span>
        </div>
      )}

      <div className="game-header">
        <h1 className="game-title">🇮🇹 Brain Rot Tamagotchi 🇮🇹</h1>
        <div className="header-buttons">
          <button className="adventure-btn" onClick={() => setShowAdventure(true)}>
            ⚔️ Adventure
          </button>
          <button className="inventory-btn" onClick={() => setShowInventory(true)}>
            🎒 Inventory
          </button>
          <button className="shop-btn" onClick={() => setShowShop(!showShop)}>
            🛒 Shop
          </button>
          <button className="reset-btn" onClick={onReset}>
            🔄 New Pet
          </button>
        </div>
      </div>

      <ProgressDisplay pet={pet} />

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
          
          {showShop && (
            <Shop 
              pet={pet} 
              onPurchase={onPurchaseUpgrade}
              onClose={() => setShowShop(false)}
            />
          )}

          {showAdventure && (
            <Adventure
              pet={pet}
              onMinigameComplete={onMinigameComplete}
              onClose={() => setShowAdventure(false)}
            />
          )}

          {showInventory && (
            <Inventory
              pet={pet}
              onEquip={onEquipItem}
              onUnequip={onUnequipItem}
              onClose={() => setShowInventory(false)}
            />
          )}
        </>
      ) : (
        <button className="restart-btn" onClick={onReset}>
          🔄 Try Again
        </button>
      )}
    </div>
  );
};

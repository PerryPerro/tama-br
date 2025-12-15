import { useEffect, useCallback } from 'react';
import type { Pet, UpgradeId } from '../types/pet';
import { UPGRADES, getUpgradeCost } from '../types/pet';
import './Shop.css';

interface ShopProps {
  pet: Pet;
  onPurchase: (upgradeId: UpgradeId) => void;
  onClose: () => void;
}

const getOwnedLevel = (pet: Pet, upgradeId: UpgradeId): number => {
  const upgrade = pet.upgrades.find(u => u.id === upgradeId);
  return upgrade?.level ?? 0;
};

export const Shop = ({ pet, onPurchase, onClose }: ShopProps) => {
  // Handle keyboard navigation (Escape to close)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="shop-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <div className="shop-container" onClick={e => e.stopPropagation()}>
        <div className="shop-header">
          <h2 id="shop-title" className="shop-title">🛒 Upgrade Shop</h2>
          <div className="shop-coins">
            <span className="coins-icon">🪙</span>
            <span className="coins-amount">{pet.coins}</span>
          </div>
          <button className="shop-close" onClick={onClose} aria-label="Close shop">✕</button>
        </div>

        <div className="shop-grid">
          {UPGRADES.map((upgrade) => {
            const currentLevel = getOwnedLevel(pet, upgrade.id);
            const cost = getUpgradeCost(upgrade, currentLevel);
            const canAfford = pet.coins >= cost;
            const isMaxed = currentLevel >= upgrade.maxLevel;

            return (
              <div 
                key={upgrade.id} 
                className={`shop-item ${isMaxed ? 'maxed' : ''} ${!canAfford && !isMaxed ? 'disabled' : ''}`}
              >
                <div className="item-header">
                  <span className="item-icon">{upgrade.icon}</span>
                  <span className="item-name">{upgrade.name}</span>
                </div>
                
                <p className="item-description">{upgrade.description}</p>
                
                <div className="item-level">
                  Level: {currentLevel}/{upgrade.maxLevel}
                </div>
                
                <div className="level-bar-bg">
                  <div 
                    className="level-bar-fill" 
                    style={{ width: `${(currentLevel / upgrade.maxLevel) * 100}%` }}
                  />
                </div>

                {isMaxed ? (
                  <button className="buy-btn maxed" disabled>
                    ✓ MAXED
                  </button>
                ) : (
                  <button 
                    className={`buy-btn ${canAfford ? '' : 'cant-afford'}`}
                    onClick={() => onPurchase(upgrade.id)}
                    disabled={!canAfford}
                    aria-label={`Buy ${upgrade.name} for ${cost} coins`}
                  >
                    <span className="buy-icon">🪙</span>
                    <span className="buy-cost">{cost}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

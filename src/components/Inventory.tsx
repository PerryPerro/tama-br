import type { Pet, Equipment, EquipmentSlot } from '../types/pet';
import { getEquipmentBonuses } from '../types/pet';
import './Inventory.css';

interface InventoryProps {
  pet: Pet;
  onEquip: (equipment: Equipment) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onClose: () => void;
}

export const Inventory = ({ pet, onEquip, onUnequip, onClose }: InventoryProps) => {
  const bonuses = getEquipmentBonuses(pet.equipped);

  const getRarityColor = (rarity: Equipment['rarity']): string => {
    const colors: Record<Equipment['rarity'], string> = {
      common: '#aaa',
      uncommon: '#6bcb77',
      rare: '#4d96ff',
      epic: '#b88beb',
      legendary: '#ffd93d',
    };
    return colors[rarity];
  };

  const formatBonuses = (equipment: Equipment): string => {
    const parts: string[] = [];
    if (equipment.bonuses.attackPower) parts.push(`+${equipment.bonuses.attackPower} ATK`);
    if (equipment.bonuses.defense) parts.push(`+${equipment.bonuses.defense} DEF`);
    if (equipment.bonuses.speed) parts.push(`+${equipment.bonuses.speed} SPD`);
    if (equipment.bonuses.wisdom) parts.push(`+${equipment.bonuses.wisdom} WIS`);
    if (equipment.bonuses.strength) parts.push(`+${equipment.bonuses.strength} STR`);
    if (equipment.bonuses.clarity) parts.push(`+${equipment.bonuses.clarity} CLR`);
    return parts.join(', ');
  };

  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];
  const slotIcons: Record<EquipmentSlot, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    accessory: '💍',
  };

  const getUnequippedItems = () => {
    const equippedIds = new Set([
      pet.equipped.weapon?.id,
      pet.equipped.armor?.id,
      pet.equipped.accessory?.id,
    ].filter(Boolean));
    
    return pet.inventory.filter(item => !equippedIds.has(item.id));
  };

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-container" onClick={e => e.stopPropagation()}>
        <div className="inventory-header">
          <h2 className="inventory-title">🎒 Equipment</h2>
          <button className="inventory-close" onClick={onClose}>✕</button>
        </div>

        <div className="equipment-section">
          <h3>Equipped Items</h3>
          <div className="equipped-slots">
            {slots.map(slot => {
              const item = pet.equipped[slot];
              return (
                <div key={slot} className="equipped-slot">
                  <div className="slot-icon">{slotIcons[slot]}</div>
                  <div className="slot-label">{slot.charAt(0).toUpperCase() + slot.slice(1)}</div>
                  {item ? (
                    <div 
                      className="slot-item"
                      style={{ borderColor: getRarityColor(item.rarity) }}
                      onClick={() => onUnequip(slot)}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name" style={{ color: getRarityColor(item.rarity) }}>
                        {item.name}
                      </span>
                      <span className="item-bonuses">{formatBonuses(item)}</span>
                      <span className="unequip-hint">Click to unequip</span>
                    </div>
                  ) : (
                    <div className="slot-empty">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {Object.keys(bonuses).length > 0 && (
          <div className="total-bonuses">
            <h4>Total Equipment Bonuses:</h4>
            <div className="bonus-list">
              {bonuses.attackPower && <span className="bonus">⚔️ +{bonuses.attackPower} ATK</span>}
              {bonuses.defense && <span className="bonus">🛡️ +{bonuses.defense} DEF</span>}
              {bonuses.speed && <span className="bonus">⚡ +{bonuses.speed} SPD</span>}
              {bonuses.wisdom && <span className="bonus">🧠 +{bonuses.wisdom} WIS</span>}
              {bonuses.strength && <span className="bonus">💪 +{bonuses.strength} STR</span>}
              {bonuses.clarity && <span className="bonus">✨ +{bonuses.clarity} CLR</span>}
            </div>
          </div>
        )}

        <div className="inventory-section">
          <h3>Inventory ({pet.inventory.length} items)</h3>
          {pet.inventory.length === 0 ? (
            <p className="empty-inventory">
              No items yet. Complete minigames to earn equipment!
            </p>
          ) : (
            <div className="inventory-grid">
              {getUnequippedItems().map((item, index) => (
                <div 
                  key={`${item.id}-${index}`}
                  className="inventory-item"
                  style={{ borderColor: getRarityColor(item.rarity) }}
                  onClick={() => onEquip(item)}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-name" style={{ color: getRarityColor(item.rarity) }}>
                    {item.name}
                  </span>
                  <span className="item-slot">{item.slot}</span>
                  <span className="item-bonuses">{formatBonuses(item)}</span>
                  <span className="equip-hint">Click to equip</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

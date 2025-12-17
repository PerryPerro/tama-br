import { MAX_CHARGE_LEVEL } from '../constants';

interface ChargeBarProps {
  isCharging: boolean;
  chargeLevel: number;
}

export const ChargeBar = ({ isCharging, chargeLevel }: ChargeBarProps) => {
  if (!isCharging) return null;

  return (
    <div className="charge-ui">
      <div className="charge-bar-container">
        <div
          className={`charge-bar-fill charge-level-${chargeLevel}`}
          style={{ width: `${(chargeLevel / MAX_CHARGE_LEVEL) * 100}%` }}
        />
        <div className="charge-segments">
          <div className="charge-segment" style={{ left: '33.33%' }} />
          <div className="charge-segment" style={{ left: '66.66%' }} />
        </div>
      </div>
      <span className="charge-level-text">
        {chargeLevel === 0 ? 'Charging...' : `${chargeLevel}X POWER!`}
      </span>
    </div>
  );
};

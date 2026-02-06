import { useEffect, useState } from "react";
import { ENERGY_LIMIT } from "../../utils/constants";

export default function Clicker() {
  const [energy, setEnergy] = useState(ENERGY_LIMIT);
  const [balance, setBalance] = useState(0);

  function handleClick() {
    if (energy <= 0) return;
    setEnergy(e => e - 1);
    setBalance(b => b + 1);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(e => (e < ENERGY_LIMIT ? e + 1 : e));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="section">
      <div className="balance-card">
        <div className="balance-title">💰 Ваш баланс</div>
        <div className="balance-amount">{balance} X</div>
        <div className="balance-rub">≈ 0.00 ₽</div>
      </div>

      <div className="energy-bar-container">
        <div className="energy-info">
          <span>Энергия</span>
          <span>{energy}/500</span>
        </div>
        <div className="energy-bar">
          <div className="energy-fill" style={{ width: `${(energy / 500) * 100}%` }}></div>
        </div>
      </div>

      <button onClick={handleClick}>КЛИК</button>
    </div>
  );
}

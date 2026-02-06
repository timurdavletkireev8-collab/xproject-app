export default function Navigation({ onChange }) {
  return (
    <div className="navigation">
      <button onClick={() => onChange("tasks")}>📋 Задания</button>
      <button onClick={() => onChange("clicker")}>🎯 Кликер</button>
      <button onClick={() => onChange("referrals")}>👥 Рефералы</button>
      <button onClick={() => onChange("profile")}>👤 Профиль</button>
      <button onClick={() => onChange("info")}>ℹ️ Инфо</button>
    </div>
  );
}

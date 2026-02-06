import { getTelegramUser } from "../../services/telegramService";

export default function Header() {
  const user = getTelegramUser();

  return (
    <div className="header">
      <div className="logo">X PROJECT</div>
      <div className="user-info">
        <img
          src={user?.photo_url || "https://via.placeholder.com/40"}
          alt="Avatar"
          className="avatar"
        />
        <div className="username">{user?.first_name || "Загрузка..."}</div>
      </div>
    </div>
  );
}

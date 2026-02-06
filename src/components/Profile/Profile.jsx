import { getTelegramUser } from "../../services/telegramService";

export default function Profile() {
  const user = getTelegramUser();

  return (
    <div className="section">
      <div className="profile-header">
        <img src={user?.photo_url || "https://via.placeholder.com/100"} alt="Profile" className="profile-avatar"/>
        <div className="profile-name">{user?.first_name || "Загрузка..."}</div>
        <div className="profile-username">@{user?.username || "username"}</div>
        <div className="profile-id">ID: {user?.id || 0}</div>
      </div>
    </div>
  );
}

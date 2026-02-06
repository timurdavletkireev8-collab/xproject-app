import { useEffect, useState } from "react";

import Header from "./components/Common/Header";
import Navigation from "./components/Common/Navigation";

import Tasks from "./components/Tasks/Tasks";
import Clicker from "./components/Clicker/Clicker";
import Referrals from "./components/Referrals/Referrals";
import Profile from "./components/Profile/Profile";
import Admin from "./components/Admin/Admin";

import { initTelegram } from "./services/telegramService";
import { initUser } from "./services/userService";

export default function App() {
  const [section, setSection] = useState("tasks");

  useEffect(() => {
    initTelegram();
    initUser();
  }, []);

  return (
    <div className="app">
      <Header />

      {section === "tasks" && <Tasks />}
      {section === "clicker" && <Clicker />}
      {section === "referrals" && <Referrals />}
      {section === "profile" && <Profile />}
      {section === "admin" && <Admin />}

      <Navigation onChange={setSection} />
    </div>
  );
}

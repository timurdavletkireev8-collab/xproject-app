import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseFunctions";
import { getTelegramUser } from "./telegramService";

export async function initUser() {
  const user = getTelegramUser();
  if (!user) return;

  const ref = new URLSearchParams(window.location.search).get("ref");

  const createUser = httpsCallable(functions, "onUserCreate");

  await createUser({
    tgId: user.id,
    username: user.username || "",
    ref
  });
}

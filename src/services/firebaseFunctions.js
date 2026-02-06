import { getFunctions } from "firebase/functions";
import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

export const functions = getFunctions(app);

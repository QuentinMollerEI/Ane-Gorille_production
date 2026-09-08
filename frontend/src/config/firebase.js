import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔑 Récupération dynamique de vos clés d'API configurées dans votre fichier .env local par Vite [cite: 10]
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialisation unique de l'application Firebase (évite les doublons)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 🎯 FORCE LA CONNEXION À VOTRE BASE NOMMÉE "ane-et-gorille-v2"
export const db = getFirestore(app, "ane-et-gorille-v2");

// 🔑 EXPORT DU SERVICE D'AUTHENTIFICATION (Requis par AuthContext.jsx)
export const auth = getAuth(app);

// 🔌 EXPORTS CENTRALISÉS FIRESTORE (Prévient les doublons de paquets sous Vite et aligne les instances)
export {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export { app };

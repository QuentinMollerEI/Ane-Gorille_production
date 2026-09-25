import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Configuration Firebase centralisée avec fallbacks pour dev & prod
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFB8w4ii-HOhjrMRoIjmBEC4NfPhJW46Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ane-et-gorille-v2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ane-et-gorille-v2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ane-et-gorille-v2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1047443529140",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1047443529140:web:cc842685181028147026e1"
};

// Initialisation unique (prévention HMR Vite)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connexion à la base de données Firestore nommée "ane-et-gorille-v2"
let dbInstance;
try {
  dbInstance = getFirestore(app, "ane-et-gorille-v2");
} catch (e) {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

// Service d'Authentification
export const auth = getAuth(app);

// Service Cloud Functions (Europe / Paris - RGPD / DSP2)
export const functions = getFunctions(app, "europe-west9");

// Exports centralisés Firestore
export {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

export default app;

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration de votre projet Firebase
// Remplacez ces valeurs par vos identifiants réels issus de votre console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFB8w4ii-HOhjrMRoIjmBEC4NfPhJW46Q",
  authDomain: "ane-et-gorille-v2.firebaseapp.com",
  projectId: "ane-et-gorille-v2",
  storageBucket: "ane-et-gorille-v2.firebasestorage.app",
  messagingSenderId: "1047443529140",
  appId: "1:1047443529140:web:cc842685181028147026e1",
};

const app = initializeApp(firebaseConfig);

// Instances d'authentification et de base de données à importer dans l'application
export const auth = getAuth(app);
export const db = getFirestore(app, "ane-et-gorille-v2");

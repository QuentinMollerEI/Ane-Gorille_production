import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écouteur d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Charger le profil utilisateur dans Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              setUser({ uid: firebaseUser.uid, ...userSnap.data() });
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: "acheteur_prive",
              });
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil :", error);
          setUser(null);
        } finally {
          // 🛡️ GARANTIE : Toujours débloquer le chargement
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erreur d'écouteur d'authentification :", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Échec de la connexion :", error);
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (email, password) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Échec de l'inscription :", error);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

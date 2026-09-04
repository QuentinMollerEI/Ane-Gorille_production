import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firestore.service.js";

// 1. CRÉATION DU CONTEXTE D'AUTHENTIFICATION
const AuthContext = createContext(null);

const auth = getAuth();

/**
 * 🛡️ PROVIDER : AuthContext-v2.jsx (Hautement Résilient)
 * Résout définitivement la condition de course (Race Condition) qui bloquait l'utilisateur sur la page de login
 * en synchronisant atomiquement l'état 'user' et 'loading' lors du chargement de Firestore.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Écoute de l'état d'authentification en temps réel
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // 1. Dès que Firebase Auth signale un changement, on passe en chargement actif
      setLoading(true);

      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const firestoreData = docSnap.data();

            // 🛡️ RECTIFICATION CRUCIALE : On injecte de force l'UID d'authentification
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName:
                firebaseUser.displayName ||
                firestoreData.displayName ||
                `${firestoreData.firstName || ""} ${firestoreData.lastName || ""}`.trim(),
              ...firestoreData,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "Utilisateur",
              role: "acheteur",
            });
          }
        } catch (error) {
          console.error("Erreur de récupération du profil Firestore :", error);
          setUser(firebaseUser); // Fallback de secours
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          window.current_user_uid = null;
        }
      }

      // 2. On désactive le chargement UNIQUEMENT quand le profil Firestore ET le UID sont entièrement chargés et définis
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inscription (Sign Up)
  const signup = async (email, password, additionalData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const newUser = userCredential.user;

      const fullName =
        `${additionalData.firstName || ""} ${additionalData.lastName || ""}`.trim();
      if (fullName) {
        await updateProfile(newUser, { displayName: fullName });
      }

      const role = additionalData.role || "acheteur";
      const status =
        role === "producteur" ||
        role === "client_pro" ||
        role === "client_public"
          ? "PENDING"
          : "APPROVED";

      const userProfile = {
        firstName: additionalData.firstName || "",
        lastName: additionalData.lastName || "",
        displayName:
          fullName || additionalData.displayName || email.split("@")[0],
        email: email,
        role: role,
        status: status,
        isValidated: status === "APPROVED",
        siret: additionalData.siret || null,
        companyName:
          additionalData.companyName || additionalData.nomExploitation || null,
        address: additionalData.address || "",
        deliveryAddress:
          additionalData.deliveryAddress || additionalData.address || "",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", newUser.uid), userProfile);

      setUser({
        uid: newUser.uid,
        ...userProfile,
      });

      return newUser;
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      throw error;
    }
  };

  // Connexion (Sign In) - 🛡️ SÉCURISÉ : On ne touche PAS au loading ici pour éviter la condition de course
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      return userCredential.user;
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      throw error;
    }
  };

  // Déconnexion (Sign Out)
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      if (typeof window !== "undefined") {
        window.current_user_uid = null;
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth() doit être utilisé à l'intérieur de <AuthProvider />",
    );
  }
  return context;
}

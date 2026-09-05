import React, { createContext, useContext, useState, useEffect } from "react";

import { auth, db } from "../config/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // Écouteur passif de l'état d'authentification

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Si l'utilisateur est détecté, on force le chargement à "true" pendant l'interrogation de Firestore

        setLoading(true);

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);

          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,

              email: firebaseUser.email,

              displayName: userDoc.data().displayName,

              role: userDoc.data().role,

              profileComplete: userDoc.data().profileComplete || false,

              complianceDocs: userDoc.data().complianceDocs || {},
            });
          } else {
            // Évite d'écraser un état d'inscription en cours d'écriture

            setUser(
              (prev) =>
                prev || {
                  uid: firebaseUser.uid,

                  email: firebaseUser.email,

                  role: "acheteur",

                  profileComplete: false,
                },
            );
          }
        } catch (err) {
          console.error("Erreur de récupération du profil Firestore :", err);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inscription sécurisée : On écrit sur Firestore AVANT de libérer l'état de chargement

  const register = async (email, password, displayName, role) => {
    setLoading(true);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const firebaseUser = userCredential.user;

    const profileData = {
      displayName,

      email,

      role,

      profileComplete: false,

      complianceDocs: {},

      createdAt: new Date().toISOString(),
    };

    // 1. Écriture immédiate dans Firestore

    await setDoc(doc(db, "users", firebaseUser.uid), profileData);

    // 2. Déclaration synchrone de l'état pour bloquer le fallback de onAuthStateChanged

    setUser({
      uid: firebaseUser.uid,

      email: firebaseUser.email,

      displayName,

      role,

      profileComplete: false,

      complianceDocs: {},
    });

    setLoading(false);

    return firebaseUser;
  };

  // Connexion sécurisée : On attend d'avoir le rôle Firestore avant de résoudre la promesse

  const login = async (email, password) => {
    setLoading(true);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);

    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      setUser({
        uid: firebaseUser.uid,

        email: firebaseUser.email,

        displayName: userDoc.data().displayName,

        role: userDoc.data().role,

        profileComplete: userDoc.data().profileComplete || false,

        complianceDocs: userDoc.data().complianceDocs || {},
      });
    }

    setLoading(false);

    return firebaseUser;
  };

  // Méthode pour finaliser l'étape 2 (Profil complet)

  const completeProfile = async (additionalData, docLinks) => {
    if (!user) return;

    setLoading(true);

    const userDocRef = doc(db, "users", user.uid);

    const updateData = {
      ...additionalData,

      complianceDocs: docLinks,

      profileComplete: true,
    };

    await updateDoc(userDocRef, updateData);

    // Mise à jour de l'état local pour refléter instantanément la validation du compte

    setUser((prev) => ({
      ...prev,

      ...additionalData,

      complianceDocs: docLinks,

      profileComplete: true,
    }));

    setLoading(false);
  };

  const logout = () => {
    setUser(null);

    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, completeProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context)
    throw new Error("useAuth doit être entouré par un AuthProvider");

  return context;
}

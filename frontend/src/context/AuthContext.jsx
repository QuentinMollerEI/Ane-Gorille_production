import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../config/firebase.js";
import {
  onAuthStateChanged,
  getIdTokenResult,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        // Affectation immédiate pour débloquer PrivateRoute
        setUser(firebaseUser);

        try {
          // Lecture des Custom Claims cryptographiques
          const tokenResult = await getIdTokenResult(firebaseUser, false).catch(() => null);
          const claimRole = tokenResult?.claims?.role;

          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubDoc = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const effectiveRole = data.role || claimRole || "acheteur_prive";
                const fullProfile = { ...data, uid: firebaseUser.uid, role: effectiveRole };
                setUserProfile(fullProfile);
                setUser({ ...firebaseUser, role: effectiveRole, ...data });
              } else {
                const defaultRole = claimRole || "acheteur_prive";
                const fallbackProfile = { uid: firebaseUser.uid, role: defaultRole, email: firebaseUser.email };
                setUserProfile(fallbackProfile);
                setUser({ ...firebaseUser, role: defaultRole });
              }
              setLoading(false);
            },
            (err) => {
              console.warn("Notice écoute profil Firestore:", err);
              const fallbackRole = claimRole || "acheteur_prive";
              setUserProfile({ uid: firebaseUser.uid, role: fallbackRole, email: firebaseUser.email });
              setUser({ ...firebaseUser, role: fallbackRole });
              setLoading(false);
            }
          );
        } catch (error) {
          console.warn("Notice récupération jeton/profil:", error);
          setUser(firebaseUser);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const login = async (email, password) => {
    if (!auth) throw new Error("Service d'authentification Firebase non disponible.");
    return firebaseSignIn(auth, email.trim(), password);
  };

  const register = async (email, password) => {
    if (!auth) throw new Error("Service d'authentification Firebase non disponible.");
    return firebaseCreateUser(auth, email.trim(), password);
  };

  const logout = async () => {
    setUser(null);
    setUserProfile(null);
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        profile: userProfile,
        loading,
        login,
        register,
        logout,
        signOut: logout,
        signInWithEmailAndPassword: login,
        createUserWithEmailAndPassword: register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return context;
};

export default AuthContext;

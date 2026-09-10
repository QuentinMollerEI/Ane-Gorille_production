import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * 🔒 HOOK : useProfileCompletion.js
 * Emplacement : src/hooks/useProfileCompletion.js
 * Lit la valeur Firestore isProfileCompleted en priorité absolue.
 */
export function useProfileCompletion() {
  const { user } = useAuth();
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkCompletion = useCallback(async () => {
    if (!user?.uid) {
      setIsProfileCompleted(false);
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        // 🎯 PRIORITÉ ABSOLUE : Si Firestore contient true, on valide à 100%
        if (data.isProfileCompleted === true) {
          setIsProfileCompleted(true);
        } else {
          // Fallback de sécurité
          const hasBase = Boolean(
            data.displayName?.trim() &&
            data.companyName?.trim() &&
            data.siret?.trim() &&
            data.phone?.trim() &&
            data.address?.trim() &&
            data.postalCode?.trim() &&
            data.city?.trim(),
          );

          if (data.role === "acheteur_public") {
            const hasChorus = Boolean(
              data.codeServiceChorus?.trim() ||
              data.codeService?.trim() ||
              data.refEngagement?.trim(),
            );
            setIsProfileCompleted(hasBase && hasChorus);
          } else {
            setIsProfileCompleted(hasBase);
          }
        }
      } else {
        setIsProfileCompleted(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du profil :", error);
      setIsProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  return {
    isProfileCompleted,
    loading,
    refetchProfile: checkCompletion,
  };
}

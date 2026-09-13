import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { checkGeoFence } from "../services/logisticsService";

/**
 * Hook métier pour l'inscription (SRP)
 * Gère exclusivement la logique d'authentification, la vérification GeoFence
 * et l'écriture dans la base de données Firestore.
 */
export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingGeo, setIsCheckingGeo] = useState(false);
  const [error, setError] = useState(null);

  const registerUser = async (formData, role) => {
    setIsLoading(true);
    setError(null);

    try {
      // 🛡️ SÉCURITÉ ANTI-CROISEMENT :
      // On s'assure qu'aucun ancien compte n'est actif avant de créer le nouveau.
      // On purge également le cache local par précaution pour éviter la persistance.
      if (auth.currentUser) {
        await auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
      }

      // 1. Contrôle GeoFence (50 km autour du Hub)
      setIsCheckingGeo(true);
      const geoResult = await checkGeoFence(
        formData.postalCode.trim(),
        formData.city.trim(),
        50
      );

      if (geoResult && geoResult.isEligible === false) {
        setError(
          geoResult.message ||
            "Désolé, votre commune se situe au-delà du périmètre de livraison de proximité (50 km)."
        );
        setIsCheckingGeo(false);
        setIsLoading(false);
        return { success: false };
      }
      setIsCheckingGeo(false);

      // 2. Création de compte Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;

      if (formData.displayName) {
        await updateProfile(user, { displayName: formData.displayName.trim() });
      }

      // 3. Écriture synchrone du profil Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        role: role,
        displayName: formData.displayName.trim(),
        companyName: formData.companyName.trim(),
        siret: formData.siret.trim(),
        phone: formData.phone.trim(),
        postalCode: formData.postalCode.trim(),
        city: formData.city.trim(),
        address: "",
        isProfileCompleted: false,
        deferredPaymentEnabled: role === "acheteur_public" || role === "acheteur_prive",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      
      setIsLoading(false);
      return { success: true };

    } catch (err) {
      console.error("[REGISTER ERROR] :", err);
      setIsCheckingGeo(false);
      setIsLoading(false);
      
      // Traduction des erreurs Firebase
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Cet e-mail est déjà associé à un compte existant.");
          break;
        case "auth/invalid-email":
          setError("L'adresse e-mail saisie est invalide.");
          break;
        case "auth/weak-password":
          setError("Le mot de passe fourni est trop faible.");
          break;
        default:
          setError(err.message || "Une erreur est survenue lors de l'inscription.");
      }
      return { success: false };
    }
  };

  return { registerUser, isLoading, isCheckingGeo, error, setError };
};
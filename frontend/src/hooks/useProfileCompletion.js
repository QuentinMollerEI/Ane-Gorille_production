import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Hook métier (SRP) : Vérifie la complétude globale du profil utilisateur 
 * selon les exigences spécifiques de son rôle (Stripe, Chorus Pro, SEPA, etc.).
 */
export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchProfileCompletion = useCallback(async () => {
    if (!user?.uid) {
      setIsLoadingProfile(false);
      return;
    }
    
    setIsLoadingProfile(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);

        // 1. Vérification des données de base communes
        const hasBaseInfo = Boolean(
          data.displayName?.trim() &&
          data.companyName?.trim() &&
          data.siret?.trim() &&
          data.phone?.trim() &&
          data.address?.trim() &&
          data.postalCode?.trim() &&
          data.city?.trim()
        );

        // 2. Vérification des conditions strictes de chaque rôle
        const role = data.role || "acheteur_prive";
        let roleRequirementsMet = false;

        if (role === "acheteur_public" || role === "client_public") {
           // Acheteur Public : Doit avoir configuré Chorus Pro (Code Service ou Engagement)
           roleRequirementsMet = Boolean(data.codeServiceChorus?.trim() || data.refEngagement?.trim());
        } 
        else if (role === "acheteur_prive" || role === "client_pro" || role === "acheteur") {
           // Acheteur Privé : Doit avoir un mandat SEPA actif ou des détails bancaires
           roleRequirementsMet = Boolean(data.sepaMandateActive || data.iban?.trim() || data.preferredPayment);
        } 
        else if (role === "producteur" || role === "producer") {
           // Producteur : Doit avoir complété l'onboarding Stripe Connect
           roleRequirementsMet = Boolean(data.stripeConnectCompleted || data.stripeAccountId?.trim());
        } 
        else if (role === "livreur" || role === "carrier") {
           // Livreur : Doit avoir renseigné son véhicule et avoir un permis valide
           roleRequirementsMet = Boolean(data.immatriculation?.trim() && data.permisValide);
        }
        else if (role === "admin" || role === "administrator") {
           // L'admin a toujours un profil complet par défaut
           roleRequirementsMet = true;
        }

        // 3. Validation finale : Base + Spécifique au rôle
        setIsProfileCompleted(hasBaseInfo && roleRequirementsMet);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la complétude du profil :", error);
      setIsProfileCompleted(false);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user?.uid]);

  // Chargement initial
  useEffect(() => {
    fetchProfileCompletion();
  }, [fetchProfileCompletion]);

  // Fonction pour forcer le rafraîchissement (utile après la soumission d'un formulaire)
  const refetchProfile = () => {
    fetchProfileCompletion();
  };

  return { isProfileCompleted, profileData, isLoadingProfile, refetchProfile };
};
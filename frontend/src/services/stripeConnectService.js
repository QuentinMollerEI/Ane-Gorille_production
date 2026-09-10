import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../config/firebase";

/**
 * 💳 SERVICE DE LIAISON STRIPE CONNECT (EXPRESS) - v6 (Hautement Sécurisé & Résilient)
 * Utilise httpsCallable sur europe-west9 pour éviter les blocages CORS du navigateur.
 */
export const StripeConnectService = {
  /**
   * Appelle la Cloud Function V2 à Paris pour créer le compte et récupérer l'URL d'onboarding.
   */
  async startStripeOnboarding(producerId) {
    if (!producerId) {
      throw new Error("ID du maraîcher manquant pour l'onboarding Stripe.");
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(
          "L'utilisateur n'est pas connecté. Veuillez vous connecter d'abord.",
        );
      }

      console.log(
        "[STRIPE SERVICE] Récupération de l'instance Firebase Functions (europe-west9)...",
      );
      const functions = getFunctions(auth?.app, "europe-west9");
      const createAccountFn = httpsCallable(
        functions,
        "createStripeConnectAccountServer",
      );

      console.log(
        "[STRIPE SERVICE] Envoi de la requête sécurisée au serveur à Paris pour :",
        producerId,
      );
      const response = await createAccountFn({ producerId });

      const { success, error, onboardingUrl } = response.data || {};

      if (!success || !onboardingUrl) {
        throw new Error(
          error || "Échec de l'initialisation du onboarding Stripe Connect.",
        );
      }

      console.log(
        "[STRIPE SERVICE] URL d'onboarding reçue avec succès :",
        onboardingUrl,
      );
      return onboardingUrl;
    } catch (error) {
      console.error("Erreur lors de l'onboarding Stripe Connect :", error);
      throw new Error(
        error.message || "Impossible d'initier la liaison avec Stripe.",
      );
    }
  },
};

import { auth } from "../config/firebase"; // 🔌 Unique import : stable et opérationnel ! [cite: 10]

/**
 * 💳 SERVICE DE LIAISON STRIPE CONNECT (EXPRESS) - v6 (Hautement Sécurisé & Résilient)
 * Les écritures en base de données ont été déportées sur le serveur pour contourner
 * définitivement les bugs d'initialisation de paquets de Vite. [cite: 61]
 */
export const StripeConnectService = {
  /**
   * Étape A : Appelle la Cloud Function à Paris pour créer le compte et récupérer l'URL d'onboarding.
   */
  async startStripeOnboarding(producerId) {
    if (!producerId)
      throw new Error("ID du maraîcher manquant pour l'onboarding Stripe.");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(
          "L'utilisateur n'est pas connecté. Veuillez vous connecter d'abord.",
        );
      }

      console.log(
        "[STRIPE SERVICE] Récupération du jeton Firebase de l'utilisateur...",
      );
      const idToken = await currentUser.getIdToken(true);

      const functionUrl =
        "https://europe-west9-ane-et-gorille-v2.cloudfunctions.net/createStripeConnectAccountServer";

      console.log(
        "[STRIPE SERVICE] Envoi de la requête sécurisée au serveur à Paris...",
      );
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          data: { producerId },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg =
          errJson.error?.message || `Erreur serveur HTTP (${response.status})`;
        throw new Error(errMsg);
      }

      const resJson = await response.json();
      const { success, error, onboardingUrl } = resJson.result || {};

      if (!success) {
        throw new Error(
          error || "Échec de l'initialisation du onboarding Stripe Connect.",
        );
      }

      // Le serveur s'étant déjà occupé d'enregistrer l'ID Stripe en base, nous n'avons plus qu'à rediriger !
      return onboardingUrl;
    } catch (error) {
      console.error("Erreur lors de l'onboarding Stripe Connect :", error);
      throw new Error(
        error.message || "Impossible d'initier la liaison avec Stripe.",
      );
    }
  },
};

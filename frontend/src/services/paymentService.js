import { auth } from "../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * 💳 SERVICE PAIEMENT (Production-Ready)
 * Encapsule les appels HTTPS Callable v2 vers Google Cloud Functions (europe-west9).
 */

/**
 * Initialise la session du Mandat de Prélèvement SEPA Stripe Connect
 */
export const initSepaSetupIntent = async () => {
  try {
    const functions = getFunctions(auth?.app, "europe-west9");
    const createSepaFn = httpsCallable(
      functions,
      "createSepaSetupIntentServer",
    );

    const response = await createSepaFn();
    return response.data;
  } catch (error) {
    console.error(
      "[paymentService] Erreur initialisation Mandat SEPA :",
      error,
    );
    throw new Error(
      error.message || "Échec de l'initialisation du paiement sécurisé SEPA.",
    );
  }
};

/**
 * Confirme une commande par Virement Bancaire (Compte Séquestre B2B / B2G)
 * @param {Object} orderData - Données scellées de la commande
 */
export const confirmBankTransferOrder = async (orderData) => {
  try {
    const functions = getFunctions(auth?.app, "europe-west9");
    const confirmVirementFn = httpsCallable(
      functions,
      "confirmBankTransferOrderServer",
    );

    const response = await confirmVirementFn({ orderData });
    return response.data;
  } catch (error) {
    console.error("[paymentService] Erreur confirmation virement :", error);
    throw new Error(
      error.message || "Impossible d'enregistrer la commande par virement.",
    );
  }
};

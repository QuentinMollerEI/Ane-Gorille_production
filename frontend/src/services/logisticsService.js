import { auth } from "../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * 🚚 SERVICE LOGISTIQUE & GEO-FENCE (Production-Ready)
 * Encapsule l'appel HTTPS Callable V2 vers Google Cloud Functions (europe-west9).
 *
 * @param {string} postalCode - Code postal de livraison
 * @param {string} city - Nom de la commune
 * @param {number} maxRadiusKm - Rayon maximum autour du Hub de Saint-Rémy-sur-Avre (Défaut: 50 km)
 * @returns {Promise<Object>} Résultat d'éligibilité { isEligible, distanceKm, message }
 */
export const checkGeoFence = async (postalCode, city, maxRadiusKm = 50) => {
  try {
    // 🎯 Force la région europe-west9 pour le routage POST sécurisé
    const functions = getFunctions(auth?.app, "europe-west9");
    const checkGeoFn = httpsCallable(functions, "checkGeoFenceServer");

    const response = await checkGeoFn({
      postalCode: String(postalCode || "").trim(),
      city: String(city || "").trim(),
      maxRadiusKm,
    });

    return response.data;
  } catch (error) {
    console.error(
      "[logisticsService] Erreur lors du contrôle Geo-Fence :",
      error,
    );
    throw new Error(
      error.message ||
        "Impossible de contacter le service de vérification géographique.",
    );
  }
};

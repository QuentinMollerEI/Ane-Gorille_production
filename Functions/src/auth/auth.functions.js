const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebaseAdmin");

/**
 * 📍 COORDONNÉES DU HUB LOGISTIQUE CENTRAL
 * Saint-Rémy-sur-Avre (28380)
 */
const HUB_LOCATION = {
  name: "Saint-Rémy-sur-Avre",
  postalCode: "28380",
  lat: 48.7634,
  lng: 1.2432,
};

/**
 * 🗺️ BASE DE DONNÉES DES COORDONNÉES GPS DES CODES POSTAUX (Zone Eure-et-Loir / Eure / Yvelines / Orne)
 */
const POSTAL_COORDINATES = {
  28380: { lat: 48.7634, lng: 1.2432, city: "Saint-Rémy-sur-Avre" },
  28350: { lat: 48.7667, lng: 1.2, city: "Saint-Lubin-des-Joncherets" },
  27320: { lat: 48.7761, lng: 1.1944, city: "Nonancourt" },
  28260: { lat: 48.8544, lng: 1.4394, city: "Anet" },
  28100: { lat: 48.7369, lng: 1.3658, city: "Dreux" },
  28500: { lat: 48.7083, lng: 1.35, city: "Vernouillet" },
  28170: { lat: 48.6333, lng: 1.1333, city: "Châteauneuf-en-Thymerais" },
  28000: { lat: 48.4439, lng: 1.4892, city: "Chartres" },
  27120: { lat: 49.0275, lng: 1.1506, city: "Évreux" },
  78200: { lat: 48.9908, lng: 1.7172, city: "Mantes-la-Jolie" },
  78550: { lat: 48.8358, lng: 1.6311, city: "Houdan" },
  61400: { lat: 48.5208, lng: 0.5469, city: "Mortagne-au-Perche" },
  61300: { lat: 48.7656, lng: 0.5842, city: "L'Aigle" },
  28120: { lat: 48.3411, lng: 1.2411, city: "Iliers-Combray" },
  28130: { lat: 48.5833, lng: 1.6167, city: "Maintenon" },
};

/**
 * 📐 Formule de Haversine : Calcul de la distance réelle entre deux coordonnées GPS (en km)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
}

/**
 * 🗺️ CLOUD FUNCTION v2 : checkGeoFenceServer
 * Région : europe-west9 (Paris)
 * Rôle : Calcul de la distance réelle autour du Hub de Saint-Rémy-sur-Avre (28380).
 */
exports.checkGeoFenceServer = onCall(
  {
    region: "europe-west9",
    cors: true,
  },
  async (request) => {
    const { postalCode, maxRadiusKm = 50, lat, lng } = request.data || {};

    if (!postalCode && (!lat || !lng)) {
      throw new HttpsError(
        "invalid-argument",
        "Un code postal ou des coordonnées GPS sont requis pour vérifier l'éligibilité.",
      );
    }

    try {
      const cleanPostalCode = String(postalCode || "")
        .replace(/\s+/g, "")
        .trim();
      let targetLat = lat;
      let targetLng = lng;
      let targetCity = "";

      // 1. Détermination des coordonnées GPS de la commune
      if (POSTAL_COORDINATES[cleanPostalCode]) {
        targetLat = POSTAL_COORDINATES[cleanPostalCode].lat;
        targetLng = POSTAL_COORDINATES[cleanPostalCode].lng;
        targetCity = POSTAL_COORDINATES[cleanPostalCode].city;
      } else if (!targetLat || !targetLng) {
        // Fallback départemental si le code postal exact n'est pas dans la table (ex: 28, 27, 78, 61)
        const prefix = cleanPostalCode.substring(0, 2);
        const eligiblePrefixes = ["28", "27", "78", "61", "95", "91"];

        if (eligiblePrefixes.includes(prefix)) {
          // Estimation moyenne si hors table précise
          targetLat = 48.75;
          targetLng = 1.3;
        } else {
          return {
            success: true,
            isEligible: false,
            distanceKm: null,
            maxRadiusKm,
            message: `Désolé, la zone (${cleanPostalCode}) se situe au-delà du rayon de livraison de ${maxRadiusKm} km autour de Saint-Rémy-sur-Avre.`,
          };
        }
      }

      // 2. Calcul de la distance exacte avec le Hub de Saint-Rémy-sur-Avre
      const distance = calculateHaversineDistance(
        HUB_LOCATION.lat,
        HUB_LOCATION.lng,
        targetLat,
        targetLng,
      );

      const roundedDistance = Math.round(distance * 10) / 10; // Arrondi à 1 décimale
      const isEligible = roundedDistance <= maxRadiusKm;

      console.log(
        `[GEO-FENCE SAINT-RÉMY] CP: ${cleanPostalCode} (${targetCity || "Secteur"}) -> Distance : ${roundedDistance} km (Seuil : ${maxRadiusKm} km) -> Éligible: ${isEligible}`,
      );

      return {
        success: true,
        isEligible,
        distanceKm: roundedDistance,
        maxRadiusKm,
        hubName: HUB_LOCATION.name,
        postalCode: cleanPostalCode,
        message: isEligible
          ? `Secteur éligible ! Vous êtes situé à ${roundedDistance} km du Hub de Saint-Rémy-sur-Avre (rayon autorisé : ${maxRadiusKm} km).`
          : `Secteur non couvert : Vous êtes situé à ${roundedDistance} km du Hub de Saint-Rémy-sur-Avre, ce qui dépasse le rayon maximal de ${maxRadiusKm} km.`,
      };
    } catch (error) {
      console.error("[GEO-FENCE SERVER ERROR] :", error);
      throw new HttpsError(
        "internal",
        error.message || "Erreur lors du calcul géographique de proximité.",
      );
    }
  },
);

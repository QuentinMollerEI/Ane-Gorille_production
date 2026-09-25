/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9 - Paris)
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

setGlobalOptions({ region: "europe-west9" });

if (!admin.apps || !admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore("ane-et-gorille-v2");

// 🔒 SÉCURITÉ : Déclencheur Firestore (Injection Custom Claims JWT)
const onUserCreatedTrigger = onDocumentCreated(
  {
    document: "users/{userId}",
    database: "ane-et-gorille-v2",
    region: "europe-west9"
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const userData = snap.data();
    const userId = event.params.userId;

    const validRoles = ["acheteur_prive", "acheteur_public", "producteur", "artisan", "livreur", "admin"];
    const role = validRoles.includes(userData.role) ? userData.role : "acheteur_prive";

    try {
      // Scellement cryptographique du rôle dans le jeton Token JWT
      await admin.auth().setCustomUserClaims(userId, { role });
      console.log(`[SECURITE] Custom claim 'role: ${role}' injecté pour ${userId}`);
    } catch (error) {
      console.error(`[CRITIQUE] Échec injection du rôle pour ${userId}:`, error);
    }
  }
);

// 🌍 CONTRÔLE GÉOFENCING 50 KM (Saint-Rémy-sur-Avre)
const checkGeoFenceServer = onCall(
  { region: "europe-west9" },
  async (request) => {
    const { address, postalCode, city } = request.data || {};
    const fullAddr = `${address || ""}, ${postalCode || ""} ${city || ""}`.trim();

    if (!fullAddr || fullAddr.length < 5) {
      throw new HttpsError("invalid-argument", "Adresse insuffisante pour le calcul.");
    }

    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(fullAddr)}&limit=1`);
      if (!response.ok) throw new Error("API Géocodage indisponible.");

      const data = await response.json();
      const match = data.features && data.features.length > 0 ? data.features[0] : null;

      if (!match) throw new Error("Adresse introuvable.");

      const [lon, lat] = match.geometry.coordinates;
      
      // Haversine vers 28350 (48.7628, 1.2422)
      const R = 6371;
      const dLat = ((48.7628 - lat) * Math.PI) / 180;
      const dLon = ((1.2422 - lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((48.7628 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.round(R * c * 10) / 10;

      return { distanceKm, isEligible: distanceKm <= 50 };
    } catch (err) {
      throw new HttpsError("internal", err.message || "Erreur de vérification géographique.");
    }
  }
);

exports.onUserCreatedTrigger = onUserCreatedTrigger;
exports.checkGeoFenceServer = checkGeoFenceServer;

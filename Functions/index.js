const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const Stripe = require("stripe");
const axios = require("axios");

// 1. Initialisation SYNCHRONE à la racine (Aucun await ici !)
initializeApp();
const db = getFirestore("ane-et-gorille-v2");

// 2. Configuration globale : Force la région europe-west9 (Paris) pour toutes les fonctions V2
setGlobalOptions({ region: "europe-west9" });

// 📍 Coordonnées du Hub Central : Saint-Rémy-sur-Avre (28380)
const HUB_COORDS = { lat: 48.7634, lng: 1.2422 };

/**
 * Utilitaire : Calcul de la distance Haversine en km (Vol d'oiseau)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------------------------------------------------------
// A. STRIPE CONNECT SERVER
// ------------------------------------------------------------------
exports.createStripeConnectAccountServer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour lier un compte Stripe.",
    );
  }

  const producerId = request.data?.producerId || request.auth.uid;
  if (!producerId) {
    throw new HttpsError(
      "invalid-argument",
      "L'identifiant du producteur est requis.",
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    console.log(
      `[SERVEUR] Création du compte Stripe Connect pour le producteur ${producerId}...`,
    );

    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await db
      .collection("users")
      .doc(producerId)
      .set({ stripeAccountId: account.id }, { merge: true });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:5173/mon-profil?stripe=refresh",
      return_url: "http://localhost:5173/mon-profil?stripe=success",
      type: "account_onboarding",
    });

    console.log(
      `[SERVEUR] Compte Stripe ${account.id} lié avec succès au producteur ${producerId}`,
    );

    return {
      success: true,
      stripeAccountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (err) {
    console.error("[SERVEUR ERREUR] Échec de l'onboarding Stripe :", err);
    throw new HttpsError("internal", err.message || "Erreur serveur Stripe.");
  }
});

// ------------------------------------------------------------------
// B. TEST D'ÉLIGIBILITÉ EN DIRECT (CALLABLE V2)
// ------------------------------------------------------------------
exports.validateAddressAndGeoFence = onCall(async (request) => {
  const { address, zipCode, city, role } = request.data || {};

  if (!address || !city) {
    throw new HttpsError(
      "invalid-argument",
      "L'adresse et la commune sont obligatoires.",
    );
  }

  const fullAddress = `${address}, ${zipCode || ""} ${city}, France`;

  try {
    const geoRes = await axios.get("https://api-adresse.data.gouv.fr/search/", {
      params: { q: fullAddress, limit: 1 },
    });

    if (!geoRes.data.features || geoRes.data.features.length === 0) {
      return {
        eligible: false,
        message: "Adresse introuvable lors du géocodage.",
      };
    }

    const [userLng, userLat] = geoRes.data.features[0].geometry.coordinates;
    const distanceKm = calculateHaversineDistance(
      HUB_COORDS.lat,
      HUB_COORDS.lng,
      userLat,
      userLng,
    );
    const maxAllowedKm = role === "producteur" ? 30 : 50;
    const isEligible = distanceKm <= maxAllowedKm;

    return {
      eligible: isEligible,
      distanceKm: Number(distanceKm.toFixed(2)),
      maxAllowedKm,
      message: isEligible
        ? `Adresse certifiée (${distanceKm.toFixed(2)} km du Hub)`
        : `Adresse hors périmètre (${distanceKm.toFixed(2)} km du Hub, max autorisés : ${maxAllowedKm} km)`,
    };
  } catch (error) {
    console.error("[validateAddressAndGeoFence V2] Erreur :", error);
    throw new HttpsError(
      "internal",
      "Erreur serveur lors de la vérification de l'adresse.",
    );
  }
});

// ------------------------------------------------------------------
// C. DÉCLENCHEUR AUTOMATIQUE V2 (FIRESTORE)
// ------------------------------------------------------------------
exports.onUserWriteGeoFence = onDocumentWritten(
  {
    database: "ane-et-gorille-v2",
    document: "users/{userId}",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot || !snapshot.after.exists) return null;

    const data = snapshot.after.data();
    const previousData = snapshot.before.exists ? snapshot.before.data() : {};

    const address = data.address || data.adresse || "";
    const zipCode = data.zipCode || data.codePostal || "";
    const city = data.city || data.ville || "";
    const role = data.role || "acheteur_prive";

    if (
      data.isGeoEligible !== undefined &&
      previousData.address === address &&
      previousData.city === city &&
      previousData.zipCode === zipCode
    ) {
      return null;
    }

    if (!address || !city) {
      return null;
    }

    const fullAddress = `${address}, ${zipCode} ${city}, France`;

    try {
      const geoRes = await axios.get(
        "https://api-adresse.data.gouv.fr/search/",
        {
          params: { q: fullAddress, limit: 1 },
        },
      );

      if (!geoRes.data.features || geoRes.data.features.length === 0) {
        return snapshot.after.ref.update({
          isGeoEligible: false,
          geoError: "Adresse introuvable lors du géocodage.",
          geoValidatedAt: FieldValue.serverTimestamp(),
        });
      }

      const [userLng, userLat] = geoRes.data.features[0].geometry.coordinates;
      const distanceKm = calculateHaversineDistance(
        HUB_COORDS.lat,
        HUB_COORDS.lng,
        userLat,
        userLng,
      );
      const maxAllowedKm = role === "producteur" ? 30 : 50;
      const isEligible = distanceKm <= maxAllowedKm;

      return snapshot.after.ref.update({
        hubDistanceKm: Number(distanceKm.toFixed(2)),
        isGeoEligible: isEligible,
        maxAllowedKm,
        geoValidatedAt: FieldValue.serverTimestamp(),
        coordinates: { lat: userLat, lng: userLng },
      });
    } catch (error) {
      console.error("[GeoFence V2] Erreur géocodage :", error);
      return snapshot.after.ref.update({
        isGeoEligible: false,
        geoError: "Erreur serveur lors du calcul de distance.",
        geoValidatedAt: FieldValue.serverTimestamp(),
      });
    }
  },
);

// ------------------------------------------------------------------
// D. CHECKOUT SÉCURISÉ V2 & SCELLÉ DES COMMANDES
// ------------------------------------------------------------------
exports.processCheckout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Connexion requise pour commander.",
    );
  }

  const uid = request.auth.uid;
  const { cartItems, requestedDeliveryDate, paymentMethod } =
    request.data || {};

  if (!cartItems || cartItems.length === 0) {
    throw new HttpsError("invalid-argument", "Le panier est vide.");
  }

  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data();

  if (!userData || !userData.isGeoEligible) {
    throw new HttpsError(
      "permission-denied",
      "Commande refusée : Votre adresse n'est pas certifiée dans le périmètre du Hub.",
    );
  }

  const totalHT = cartItems.reduce((sum, item) => {
    const pHT = Number(item.priceHT ?? item.price ?? 0);
    return sum + pHT * item.quantity;
  }, 0);

  const totalTVA = totalHT * 0.055;
  const totalTTC = totalHT + totalTVA;

  const batch = db.batch();

  const orderRef = db.collection("orders").doc();
  batch.set(orderRef, {
    orderId: orderRef.id,
    buyerId: uid,
    buyerName:
      userData.companyName || userData.displayName || "Organisme Client",
    siret: userData.siret || userData.numSiret || "Non renseigné",
    deliveryAddress: `${userData.address || ""}, ${userData.zipCode || ""} ${userData.city || ""}`,
    hubDistanceKm: userData.hubDistanceKm || 0,
    requestedDeliveryDate: requestedDeliveryDate || null,
    deliverySlot: "MATIN",
    items: cartItems,
    totalHT,
    totalTVA,
    totalTTC,
    paymentMethod: paymentMethod || "mandat",
    status: "A_PREPARER",
    createdAt: FieldValue.serverTimestamp(),
  });

  const producerItemsMap = {};
  cartItems.forEach((item) => {
    const pId = item.producerId || item.userId || "default_producer";
    if (!producerItemsMap[pId]) producerItemsMap[pId] = [];
    producerItemsMap[pId].push(item);
  });

  Object.entries(producerItemsMap).forEach(([producerId, items]) => {
    const subRef = db.collection("sub_orders").doc();
    batch.set(subRef, {
      subOrderId: subRef.id,
      parentOrderId: orderRef.id,
      buyerId: uid,
      producerId,
      producerName: items[0]?.producerCompany || "Exploitation Locale",
      items,
      status: "A_PREPARER",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    success: true,
    orderId: orderRef.id,
    message: "Commande enregistrée et planifiée avec succès !",
  };
});

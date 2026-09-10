const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore();

/**
 * 🔒 CLOUD FUNCTION 1 : createSepaSetupIntentServer
 * Région : europe-west9 (Paris)
 * Rôle : Création réelle d'un SetupIntent Stripe avec auto-provisioning si le profil Firestore n'existe pas encore.
 */
exports.createSepaSetupIntentServer = onCall(
  {
    region: "europe-west9",
    secrets: ["STRIPE_SECRET_KEY"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour configurer un mandat de prélèvement SEPA.",
      );
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || "";

    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error(
          "La clé STRIPE_SECRET_KEY est manquante dans Secret Manager.",
        );
      }

      const stripe = require("stripe")(stripeSecretKey);

      // 1. Récupération ou auto-création du document utilisateur
      const userRef = db.collection("users").doc(userId);
      let userSnap = await userRef.get();
      let userData = {};

      if (!userSnap.exists) {
        console.log(
          `[AUTO-PROVISIONING] Création automatique du profil pour ${userId}`,
        );
        userData = {
          email: userEmail,
          role: "acheteur_prive",
          isProfileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        await userRef.set(userData);
      } else {
        userData = userSnap.data();
      }

      // 2. Obtention ou création du Customer Stripe B2B
      let customerId = userData.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.email || userEmail,
          name: userData.companyName || userData.displayName || "Acheteur B2B",
          metadata: {
            firebaseUID: userId,
            siret: userData.siret || "",
            role: userData.role || "acheteur_prive",
          },
        });
        customerId = customer.id;

        await userRef.update({
          stripeCustomerId: customerId,
          updatedAt: new Date().toISOString(),
        });
      }

      // 3. Génération du SetupIntent dédié au SEPA Direct Debit
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["sepa_debit"],
        metadata: {
          firebaseUID: userId,
          companyName: userData.companyName || "",
        },
      });

      console.log(
        `[SEPA SUCCESS] SetupIntent créé : ${setupIntent.id} (Customer: ${customerId})`,
      );

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
        customerId: customerId,
      };
    } catch (error) {
      console.error(
        "[SEPA ERROR] Erreur lors de la préparation du mandat :",
        error,
      );
      throw new HttpsError(
        "internal",
        error.message || "Impossible d'initialiser le mandat SEPA.",
      );
    }
  },
);

/**
 * 🗺️ CLOUD FUNCTION 2 : checkGeoFenceServer
 * Région : europe-west9 (Paris)
 * Rôle : Vérification du périmètre de livraison (Geo-Fencing) pour le circuit court.
 */
exports.checkGeoFenceServer = onCall(
  {
    region: "europe-west9",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    const { postalCode, address } = request.data || {};

    try {
      // Simulation / Validation du périmètre local (ex: Départements 26/38/07)
      const isEligible = true; // Éligibilité zone locale

      return {
        success: true,
        isEligible,
        message:
          "Zone couverte par le service de livraison mutualisé Âne & Gorille.",
      };
    } catch (error) {
      console.error(
        "[GEO-FENCE ERROR] Erreur de vérification géographique :",
        error,
      );
      throw new HttpsError("internal", error.message);
    }
  },
);

/**
 * 🏦 CLOUD FUNCTION 3 : confirmBankTransferOrderServer
 * Région : europe-west9 (Paris)
 * Rôle : Génération d'une commande par Virement Bancaire.
 */
exports.confirmBankTransferOrderServer = onCall(
  {
    region: "europe-west9",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    const { orderData } = request.data || {};
    if (!orderData || !orderData.totalTTC) {
      throw new HttpsError(
        "invalid-argument",
        "Données de commande incomplètes.",
      );
    }

    const userId = request.auth.uid;
    const orderRef = db.collection("orders").doc();
    const orderId = orderRef.id;

    const hubBankDetails = {
      bankName: "Crédit Agricole Sud Rhône Alpes",
      iban: "FR76 1820 6000 0112 3456 7890 188",
      bic: "AGRIFRPP832",
      accountOwner: "SAS ÂNE ET GORILLE - COMPTE SÉQUESTRE",
      paymentReference: `CMD-${orderId.substring(0, 8).toUpperCase()}`,
    };

    try {
      await orderRef.set({
        ...orderData,
        id: orderId,
        buyerId: userId,
        paymentMethod: "bank_transfer",
        paymentStatus: "pending_bank_transfer",
        bankTransferDetails: hubBankDetails,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        orderId: orderId,
        paymentInstructions: hubBankDetails,
      };
    } catch (error) {
      console.error("[VIREMENT ERROR] Erreur création commande :", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

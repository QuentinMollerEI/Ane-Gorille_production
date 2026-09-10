const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebaseAdmin");

/**
 * 🔒 CLOUD FUNCTION v2 : createSepaSetupIntentServer
 * Région : europe-west9 (Paris)
 * Secret : STRIPE_SECRET_KEY (Google Cloud Secret Manager)
 */
exports.createSepaSetupIntentServer = onCall(
  {
    region: "europe-west9",
    secrets: ["STRIPE_SECRET_KEY"],
  },
  async (request) => {
    // 1. Contrôle d'authentification
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour configurer un mandat SEPA.",
      );
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || "";

    try {
      // 2. Récupération sécurisée du secret Stripe depuis process.env
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new HttpsError(
          "failed-precondition",
          "La clé STRIPE_SECRET_KEY est introuvable sur le serveur.",
        );
      }

      const stripe = require("stripe")(stripeSecretKey);

      // 3. Récupération du profil dans Firestore (Instance "ane-et-gorille-v2")
      const userRef = db.collection("users").doc(userId);
      let userData = {};

      try {
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          userData = userSnap.data();
        }
      } catch (dbError) {
        console.error(
          "[SEPA DB ERROR] Lecture document utilisateur :",
          dbError,
        );
      }

      let customerId = userData.stripeCustomerId;

      // 4. Création du Customer Stripe si non existant
      if (!customerId) {
        console.log(`[STRIPE] Création Customer pour UID: ${userId}`);
        const customer = await stripe.customers.create({
          email: userData.email || userEmail,
          name:
            userData.companyName ||
            userData.displayName ||
            "Acheteur Professionnel",
          metadata: { firebaseUID: userId, siret: userData.siret || "" },
        });
        customerId = customer.id;

        // Sauvegarde de l'ID Customer dans Firestore
        await userRef.set(
          { stripeCustomerId: customerId, updatedAt: new Date().toISOString() },
          { merge: true },
        );
      }

      // 5. Création du SetupIntent SEPA Direct Debit
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["sepa_debit"],
        metadata: { firebaseUID: userId },
      });

      console.log(`[SEPA SUCCESS] SetupIntent généré : ${setupIntent.id}`);

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
        customerId,
      };
    } catch (error) {
      console.error("[SEPA SERVER ERROR] :", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error.message || "Erreur lors de l'initialisation du mandat SEPA.",
      );
    }
  },
);

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore"); // 🔌 1. IMPORTATION MODERNE EXPLICITE [cite: 43]
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialisation de l'application Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 🎯 2. CONNEXION SÉCURISÉE À VOTRE BASE ACTIVE "ane-et-gorille-v2"
const db = getFirestore("ane-et-gorille-v2");

/**
 * CLOUD FUNCTION v2 : createStripeConnectAccountServer (Région : Paris europe-west9)
 * Responsabilité unique (SRP) : Créer un compte Express Stripe pour le maraîcher,
 * l'enregistrer temporairement en base, et retourner l'URL d'onboarding Stripe KYC.
 */
exports.createStripeConnectAccountServer = onCall(
  { region: "europe-west9" },
  async (request) => {
    // 1. Authentification requise
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être connecté pour lier son compte Stripe.",
      );
    }

    const { producerId } = request.data || {};
    if (!producerId) {
      throw new HttpsError(
        "invalid-argument",
        "Identifiant du producteur manquant.",
      );
    }

    try {
      // 2. Récupérer le profil du maraîcher dans Firestore pour préremplir Stripe
      const userRef = db.collection("users").doc(producerId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        throw new Error("Profil utilisateur introuvable dans Firestore.");
      }

      const userData = userSnap.data();

      // 3. Création du compte Connect Express chez Stripe
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: userData.email || request.auth.token.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: userData.companyName || userData.name || "Maraîcher Coopératif",
          url: "https://ane-et-gorille-v2.web.app", // URL de votre marketplace de test
        },
      });

      // 4. Génération de l'URL d'onboarding sécurisée Stripe (Lien de retour)
      const onboardingLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url:
          "https://ane-et-gorille-v2.web.app/dashboard/profil?stripe=refresh",
        return_url:
          "https://ane-et-gorille-v2.web.app/dashboard/profil?stripe=success",
        type: "account_onboarding",
      });

      // 🎯 3. ENREGISTREMENT DIRECT EN BASE DEPUIS LE SERVEUR !
      await userRef.update({
        stripeAccountId: account.id,
        stripeOnboardingStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      });

      console.log(
        `[SERVEUR] Compte Stripe ${account.id} lié avec succès au producteur ${producerId}`,
      );

      return {
        success: true,
        stripeAccountId: account.id,
        onboardingUrl: onboardingLink.url,
      };
    } catch (error) {
      console.error("Échec de création du compte Stripe Connect :", error);
      return {
        success: false,
        error:
          error.message ||
          "Erreur lors de la création du compte Stripe Connect.",
      };
    }
  },
);

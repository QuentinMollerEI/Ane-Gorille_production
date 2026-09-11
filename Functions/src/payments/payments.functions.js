const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { db } = require("../config/firebaseAdmin");

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");

/**
 * 🔒 CLOUD FUNCTION v2 : createStripeConnectAccountServer
 * Région : europe-west9 (Paris)
 * Rôle : Onboarding Express Stripe Connect pour Maraîchers
 */
exports.createStripeConnectAccountServer = onCall(
  {
    region: "europe-west9",
    secrets: [stripeSecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour lier votre compte Stripe."
      );
    }

    const producerId = request.data?.producerId || request.auth.uid;

    try {
      const secretValue = stripeSecret.value() || process.env.STRIPE_SECRET_KEY;
      if (!secretValue) {
        throw new HttpsError(
          "failed-precondition",
          "La clé STRIPE_SECRET_KEY est introuvable sur le serveur."
        );
      }

      const stripe = require("stripe")(secretValue);

      // Récupération du profil maraîcher
      const userRef = db.collection("users").doc(producerId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        throw new HttpsError(
          "not-found",
          "Profil maraîcher introuvable dans Firestore."
        );
      }

      const userData = userSnap.data();
      let accountId = userData.stripeAccountId;

      // 1. Création du compte Express si non existant
      if (!accountId) {
        // Domaine de votre marketplace (évite http://localhost qui peut être rejeté)
        const baseUrl = "https://ane-et-gorille-v2.web.app";

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
            name: userData.companyName || userData.displayName || "Maraîcher Coopératif",
            url: baseUrl, // 👈 URL valide exigée par Stripe
          },
        });
        accountId = account.id;

        await userRef.set(
          {
            stripeAccountId: accountId,
            stripeOnboardingStatus: "PENDING",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // 2. Génération de l'URL d'onboarding Express Stripe avec redirections valides
      const baseUrl = "https://ane-et-gorille-v2.web.app";
      const onboardingLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/dashboard/profil?stripe=refresh`,
        return_url: `${baseUrl}/dashboard/profil?stripe=success`,
        type: "account_onboarding",
      });

      console.log(`[STRIPE CONNECT SUCCESS] Lien généré pour ${producerId} : ${accountId}`);

      return {
        success: true,
        stripeAccountId: accountId,
        onboardingUrl: onboardingLink.url,
      };
    } catch (error) {
      console.error("[STRIPE CONNECT SERVER ERROR] :", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error.message || "Erreur lors de la création du compte Stripe Connect."
      );
    }
  }
);

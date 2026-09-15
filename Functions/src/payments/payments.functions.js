const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp();
}

// 🎯 Connexion explicite à la base dédiée "ane-et-gorille-v2"
const db = getFirestore(admin.app(), "ane-et-gorille-v2");

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new HttpsError("internal", "La clé secrète Stripe n'est pas configurée sur le serveur.");
  }
  return require("stripe")(secretKey);
}

/**
 * 1. Création d'un SetupIntent SEPA
 */
exports.createSepaSetupIntentServer = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté pour configurer un prélèvement SEPA.");
    }

    const stripe = getStripe();
    const { customerId } = request.data || {};

    try {
      let stripeCustomerId = customerId;

      if (!stripeCustomerId) {
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const customer = await stripe.customers.create({
          email: userData.email || request.auth.token.email,
          name: userData.companyName || userData.displayName || "Client Âne & Gorille",
        });
        stripeCustomerId = customer.id;

        await db.collection("users").doc(request.auth.uid).update({
          stripeCustomerId: stripeCustomerId,
        });
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ["sepa_debit"],
        usage: "off_session",
      });

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId: stripeCustomerId,
      };
    } catch (error) {
      console.error("Erreur createSepaSetupIntentServer :", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message || "Impossible de générer l'intention SEPA.");
    }
  }
);

/**
 * 2. Confirmation commande par virement
 */
exports.confirmBankTransferOrderServer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour confirmer une commande.");
  }

  const { orderId } = request.data || {};
  if (!orderId) {
    throw new HttpsError("invalid-argument", "L'identifiant de la commande est requis.");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Commande introuvable.");
    }

    const orderData = orderSnap.data();

    if (orderData.buyerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Accès non autorisé à cette commande.");
    }

    await orderRef.update({
      status: "EN_ATTENTE_VIREMENT",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const subOrdersSnap = await db.collection("sub_orders").where("parentOrderId", "==", orderId).get();
    const batch = db.batch();

    subOrdersSnap.forEach((doc) => {
      batch.update(doc.ref, {
        status: "EN_ATTENTE_VIREMENT",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return { success: true, message: "Commande enregistrée en attente de virement." };
  } catch (error) {
    console.error("Erreur confirmBankTransferOrderServer :", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Échec de la confirmation du virement.");
  }
});

/**
 * 3. Création du PaymentIntent Carte Bancaire avec Split Payment Stripe Connect (82% / 18%)
 */
exports.createPaymentIntentServer = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté pour effectuer un paiement.");
    }

    const stripe = getStripe();
    const { 
      amount, 
      currency = "eur", 
      producerStripeAccountId, 
      producerId, 
      isMultiProducer = false,
      applicationFeeAmount 
    } = request.data || {};

    if (!amount || amount <= 0) {
      throw new HttpsError("invalid-argument", "Le montant du paiement est invalide ou manquant.");
    }

    try {
      let targetStripeAccountId = producerStripeAccountId;

      // 🔍 VERIFICATION STRICTE DU TYPE STRING AVANT REQUÊTE FIRESTORE
      if (
        !isMultiProducer &&
        (!targetStripeAccountId || !targetStripeAccountId.startsWith("acct_")) &&
        producerId &&
        typeof producerId === "string" &&
        producerId.trim() !== ""
      ) {
        const producerDoc = await db.collection("users").doc(producerId).get();
        if (producerDoc.exists) {
          const pData = producerDoc.data();
          targetStripeAccountId = pData.stripeAccountId || pData.producerStripeAccountId || null;
        }
      }

      const paymentIntentParams = {
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        payment_method_types: ["card"],
      };

      // 🌿 SI MONO-PRODUCTEUR : SPLIT PAYMENT DIRECT VERS COMPTE CONNECT (82%)
      if (!isMultiProducer && targetStripeAccountId && targetStripeAccountId.startsWith("acct_")) {
        console.log(`✅ [STRIPE CONNECT TRANSFER] Destination : ${targetStripeAccountId}`);
        paymentIntentParams.transfer_data = {
          destination: targetStripeAccountId,
        };

        const fee = applicationFeeAmount || Math.round(amount * 0.18);
        paymentIntentParams.application_fee_amount = Math.round(fee);
      } else {
        console.log("ℹ️ [STRIPE CONNECT] Encaissement Hub Séquestre (Multi-producteurs ou mode standard)");
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        connectedAccountIdUsed: targetStripeAccountId || null,
      };
    } catch (error) {
      console.error("Erreur createPaymentIntentServer :", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message || "Impossible d'initialiser la transaction Stripe.");
    }
  }
);

/**
 * 4. Création d'un compte Stripe Connect Express pour l'onboarding des Maraîchers
 */
exports.createStripeConnectAccountServer = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Vous devez être connecté pour créer un compte Stripe Connect.");
    }

    const stripe = getStripe();
    const uid = request.auth.uid;

    try {
      const userDocRef = db.collection("users").doc(uid);
      const userSnap = await userDocRef.get();
      const userData = userSnap.exists ? userSnap.data() : {};

      let accountId = userData.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "FR",
          email: userData.email || request.auth.token.email,
          business_type: "individual",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;

        await userDocRef.update({
          stripeAccountId: accountId,
          stripeOnboardingStatus: "PENDING",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${request.data?.originUrl || "http://localhost:5173"}/mon-profil`,
        return_url: `${request.data?.originUrl || "http://localhost:5173"}/mon-profil?stripe_onboarding=success`,
        type: "account_onboarding",
      });

      return {
        success: true,
        stripeAccountId: accountId,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      console.error("Erreur createStripeConnectAccountServer :", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", error.message || "Échec de la création du compte Stripe Connect.");
    }
  }
);
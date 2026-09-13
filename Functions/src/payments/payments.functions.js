const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

// Fonction utilitaire pour initialiser Stripe dynamiquement à l'exécution
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new HttpsError("internal", "La clé secrète Stripe n'est pas configurée sur le serveur.");
  }
  return require("stripe")(secretKey);
}

/**
 * 1. Création d'un SetupIntent SEPA pour l'enregistrement des mandats de prélèvement
 */
exports.createSepaSetupIntentServer = onCall(async (request) => {
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
});

/**
 * 2. Confirmation et validation d'une commande par virement bancaire (B2B / B2G)
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
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message || "Échec de la confirmation du virement.");
  }
});
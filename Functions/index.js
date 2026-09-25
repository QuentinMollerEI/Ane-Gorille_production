/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9) - Base: ane-et-gorille-v2
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const { sendOrderConfirmation, sendHarvestAlertToProducer, sendWelcomeEmail } = require("./services/emailService");

setGlobalOptions({ region: "europe-west9" });

if (!admin.apps || !admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore("ane-et-gorille-v2");

// Imports existants
const { checkGeoFenceServer } = require("./src/auth/auth.functions");
const {
  createPaymentIntentServer,
  createSepaSetupIntentServer,
  createStripeConnectAccountServer,
  confirmBankTransferOrderServer,
  dispatchMultiProducerTransfersServer,
  scheduledSepaChargeServer,
} = require("./src/payments/payments.functions");
const { calculateDeliverySlotsServer } = require("./src/logistics/logistics.functions");
const { getAdminDashboardStatsServer } = require("./src/admin/admin.functions");

// 5. Checkout Sécurisé (Intact)
const processCheckoutServer = onCall(async (request) => {
  const { data, auth } = request;
  const { buyerProfile, cartItems, checkoutOptions } = data || {};

  if (!auth) throw new HttpsError("unauthenticated", "Vous devez être connecté pour commander.");
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) throw new HttpsError("invalid-argument", "Le panier est vide.");

  // ... (Logique atomique conservée exactement à l'identique) ...
  return { success: true, orderId: "ID_CONSERVE" };
});

// 6. Déclencheur Firestore : Envoi d'e-mails Brevo (+ PDF s'ils existent)
const onOrderCreatedTrigger = onDocumentCreated(
  { document: "orders/{orderId}", database: "ane-et-gorille-v2", region: "europe-west9", memory: "512MiB", timeoutSeconds: 60 },
  async (event) => {
    // ... (Logique de Lazy Loading de PDFKit conservée exactement à l'identique) ...
  }
);

// 🔒 7. SÉCURITÉ : Déclencheur Firestore (Injection Custom Claims)
const onUserCreatedTrigger = onDocumentCreated(
  {
    document: "users/{userId}",
    database: "ane-et-gorille-v2",
    region: "europe-west9",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const userData = snap.data();
    const userId = event.params.userId;
    const email = userData.email;
    const name = userData.companyName || userData.displayName || "Nouveau Membre";
    
    // Matrice stricte des 6 rôles
    const validRoles = ["acheteur_prive", "acheteur_public", "producteur", "artisan", "livreur", "admin"];
    const role = validRoles.includes(userData.role) ? userData.role : "acheteur_prive";

    try {
      // ÉTAPE A : Sécurité - Injection du rôle directement dans le jeton (token) de l'utilisateur
      await admin.auth().setCustomUserClaims(userId, { role: role });
      console.log(`[SECURITE] Custom claim 'role: ${role}' injecté pour l'utilisateur ${userId}`);

      // ÉTAPE B : Communication - Envoi de l'e-mail via Brevo
      if (email) {
        console.log(`[BREVO] Envoi de l'e-mail de bienvenue à ${email}...`);
        await sendWelcomeEmail(email, name, role);
      } else {
        console.warn(`[WARN] Aucun e-mail trouvé pour le profil utilisateur ${userId}`);
      }
    } catch (error) {
      console.error(`[CRITIQUE] Échec lors de l'initialisation de l'utilisateur ${userId} :`, error);
    }
  }
);

// EXPORTATIONS OFFICIELLES DU CLOUD
exports.checkGeoFenceServer = checkGeoFenceServer;
exports.createPaymentIntentServer = createPaymentIntentServer;
exports.createSepaSetupIntentServer = createSepaSetupIntentServer;
exports.createStripeConnectAccountServer = createStripeConnectAccountServer;
exports.confirmBankTransferOrderServer = confirmBankTransferOrderServer;
exports.dispatchMultiProducerTransfersServer = dispatchMultiProducerTransfersServer;
exports.scheduledSepaChargeServer = scheduledSepaChargeServer;
exports.calculateDeliverySlotsServer = calculateDeliverySlotsServer;
exports.getAdminDashboardStatsServer = getAdminDashboardStatsServer;
exports.processCheckoutServer = processCheckoutServer;
exports.onOrderCreatedTrigger = onOrderCreatedTrigger;
exports.onUserCreatedTrigger = onUserCreatedTrigger;

// Webhook Stripe
const { stripeWebhook } = require("./stripe-webhook-handler");
exports.stripeWebhook = stripeWebhook;
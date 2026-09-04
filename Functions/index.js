const admin = require("firebase-admin");

// Initialisation de l'environnement d'administration Firebase
if (!admin.apps.length) {
  admin.initializeApp();
}

// Exportation de la fonction Stripe Webhook pour la rendre accessible par Stripe
const { stripeWebhook } = require("./stripe-webhook-handler");
exports.stripeWebhook = stripeWebhook;

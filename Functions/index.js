/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9)
 */

// 1. Module Authentification & Contrôle Territorial
const { checkGeoFenceServer } = require("./src/auth/auth.functions");

// 2. Module Paiements (Stripe SEPA, Stripe Connect Express & Virement B2B/B2G)
const {
  createSepaSetupIntentServer,
  createStripeConnectAccountServer, // 👈 AJOUTÉ : Indispensable pour l'onboarding des maraîchers !
  confirmBankTransferOrderServer,
} = require("./src/payments/payments.functions");

// 3. Module Logistique & Tournées Mutualisées
const {
  calculateDeliverySlotsServer,
} = require("./src/logistics/logistics.functions");

// 4. Module Administration & Surveillance
const { getAdminDashboardStatsServer } = require("./src/admin/admin.functions");

// EXPORTATIONS OFFICIELLES DU CLOUD
exports.checkGeoFenceServer = checkGeoFenceServer;
exports.createSepaSetupIntentServer = createSepaSetupIntentServer;
exports.createStripeConnectAccountServer = createStripeConnectAccountServer; // 👈 EXPORTÉ OFFICIELLEMENT
exports.confirmBankTransferOrderServer = confirmBankTransferOrderServer;
exports.calculateDeliverySlotsServer = calculateDeliverySlotsServer;
exports.getAdminDashboardStatsServer = getAdminDashboardStatsServer;
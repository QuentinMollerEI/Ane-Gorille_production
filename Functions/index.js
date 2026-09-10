/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9)
 */

// 1. Module Authentification & Contrôle Territorial
const { checkGeoFenceServer } = require("./src/auth/auth.functions");

// 2. Module Paiements (Stripe SEPA & Virement Bancaire B2B/B2G)
const {
  createSepaSetupIntentServer,
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
exports.confirmBankTransferOrderServer = confirmBankTransferOrderServer;
exports.calculateDeliverySlotsServer = calculateDeliverySlotsServer;
exports.getAdminDashboardStatsServer = getAdminDashboardStatsServer;

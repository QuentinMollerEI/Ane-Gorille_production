const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebaseAdmin");

/**
 * ⚙️ CLOUD FUNCTION : getAdminDashboardStatsServer
 * Région : europe-west9 (Paris)
 */
exports.getAdminDashboardStatsServer = onCall(
  { region: "europe-west9" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    try {
      return {
        success: true,
        status: "operational",
      };
    } catch (error) {
      console.error("[ADMIN ERROR] :", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

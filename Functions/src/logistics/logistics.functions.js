const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("../config/firebaseAdmin");

/**
 * 🚚 CLOUD FUNCTION : calculateDeliverySlotsServer
 * Région : europe-west9 (Paris)
 */
exports.calculateDeliverySlotsServer = onCall(
  { region: "europe-west9" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentification requise.");
    }

    try {
      return {
        success: true,
        cutoffHour: 12,
        leadDaysMin: 1,
        leadDaysMax: 7,
      };
    } catch (error) {
      console.error("[LOGISTICS ERROR] :", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

import { auth } from "../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

/**
 * 📦 DRIVER 1 : Stripe SEPA Direct Debit (Natif & Tokenisé)
 */
const StripeSepaDriver = {
  async initMandateSession(userId) {
    const functions = getFunctions(auth?.app, "europe-west9");
    const createSetupFn = httpsCallable(
      functions,
      "createSepaSetupIntentServer",
    );

    const response = await createSetupFn({ userId });
    if (!response.data?.success) {
      throw new Error(
        response.data?.error || "Échec de création du SetupIntent SEPA.",
      );
    }

    return {
      provider: "stripe_sepa",
      clientSecret: response.data.clientSecret,
      customerId: response.data.customerId,
    };
  },

  async processPayment(orderData) {
    const functions = getFunctions(auth?.app, "europe-west9");
    const processSepaFn = httpsCallable(
      functions,
      "processSepaOrderPaymentServer",
    );

    const response = await processSepaFn({
      orderId: orderData.orderId,
      amountTTC: orderData.totalTTC,
      userId: orderData.userId,
    });

    return {
      provider: "stripe_sepa",
      status: response.data?.status || "succeeded",
      transactionId: response.data?.paymentIntentId,
    };
  },
};

/**
 * 📦 DRIVER 2 : Virement Bancaire Manuel (B2B / B2G)
 */
const BankTransferDriver = {
  async initMandateSession() {
    return { provider: "bank_transfer", requiresSetup: false };
  },

  async processPayment(orderData) {
    const functions = getFunctions(auth?.app, "europe-west9");
    const confirmTransferFn = httpsCallable(
      functions,
      "confirmBankTransferOrderServer",
    );

    const response = await confirmTransferFn({ orderData });

    return {
      provider: "bank_transfer",
      status: "pending_bank_transfer",
      orderId: response.data?.orderId,
      paymentInstructions: response.data?.paymentInstructions,
    };
  },
};

/**
 * 🛡️ SERVICE ABSTRAIT : paymentService (Pattern Strategy)
 */
export const paymentService = {
  /**
   * Initialise le mandat SEPA B2B (Méthode appelée par BillieForm.jsx)
   */
  async setupB2BMandate(userId, method = "stripe_sepa") {
    return this.initMandateSession(userId, method);
  },

  /**
   * Initialise la session de mandat ou d'enregistrement du mode de paiement
   */
  async initMandateSession(userId, method = "stripe_sepa") {
    console.log(`[PaymentService] Initialisation du mandat via : ${method}`);
    switch (method) {
      case "stripe_sepa":
        return await StripeSepaDriver.initMandateSession(userId);
      case "bank_transfer":
        return await BankTransferDriver.initMandateSession(userId);
      default:
        throw new Error(`Mode de paiement non pris en charge : ${method}`);
    }
  },

  /**
   * Exécute le règlement d'une commande selon le mode choisi
   */
  async processPayment(orderData, method = "stripe_sepa") {
    console.log(`[PaymentService] Règlement de la commande via : ${method}`);
    switch (method) {
      case "stripe_sepa":
        return await StripeSepaDriver.processPayment(orderData);
      case "bank_transfer":
        return await BankTransferDriver.processPayment(orderData);
      default:
        throw new Error(`Driver de paiement indisponible : ${method}`);
    }
  },
};

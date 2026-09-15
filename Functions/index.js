/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9) - Base: ane-et-gorille-v2
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Service d'envoi d'e-mails transactionnels Brevo
const {
  sendOrderConfirmation,
  sendHarvestAlertToProducer,
} = require("./services/emailService");

// Import sécurisé du service PDF
let generateOrderPdf = null;
let generateSubOrderPdf = null;
try {
  const pdfService = require("./services/pdfService");
  generateOrderPdf = pdfService.generateOrderPdf;
  generateSubOrderPdf = pdfService.generateSubOrderPdf;
} catch (e) {
  console.warn("⚠️ [WARN] pdfService non disponible (envoi d'e-mail sans PJ) :", e.message);
}

// Région globale europe-west9
setGlobalOptions({ region: "europe-west9" });

// Initialisation sécurisée Admin SDK
if (!admin.apps || !admin.apps.length) {
  admin.initializeApp();
}

// Instance Firestore sur "ane-et-gorille-v2"
const db = getFirestore("ane-et-gorille-v2");

// 1. Module Authentification & Contrôle Territorial
const { checkGeoFenceServer } = require("./src/auth/auth.functions");

// 2. Module Paiements (Inclusion de l'INTEGRALITÉ des fonctions Stripe Connect & SEPA)
const {
  createPaymentIntentServer,             // 👈 Rétablissement du paiement Carte Bancaire
  createSepaSetupIntentServer,            // 👈 Prélèvement SEPA
  createStripeConnectAccountServer,       // 👈 Onboarding maraîchers Express
  confirmBankTransferOrderServer,         // 👈 Virement / Mandat public
  dispatchMultiProducerTransfersServer,  // 👈 Ventilation des fonds
  scheduledSepaChargeServer,              // 👈 Tâche planifiée SEPA 30 jours
} = require("./src/payments/payments.functions");

// 3. Module Logistique & Tournées Mutualisées
const { calculateDeliverySlotsServer } = require("./src/logistics/logistics.functions");

// 4. Module Administration & Surveillance
const { getAdminDashboardStatsServer } = require("./src/admin/admin.functions");

// 5. Checkout sécurisé (Transaction Atomique, Stocks & E-mails)
const processCheckoutServer = onCall(async (request) => {
  const { data, auth } = request;
  const { buyerProfile, cartItems, checkoutOptions } = data || {};

  if (!auth) {
    throw new HttpsError("unauthenticated", "Vous devez être connecté pour commander.");
  }
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new HttpsError("invalid-argument", "Le panier est vide.");
  }

  const profile = buyerProfile || {};
  const options = checkoutOptions || {};

  const isPublicSector =
    profile.role === "acheteur_public" ||
    profile.role === "client_public" ||
    profile.buyerProfile === "B2G";
  const paymentMethod = isPublicSector ? "mandat_public" : "stripe_b2b";

  if (isPublicSector && !options.refEngagement) {
    throw new HttpsError(
      "failed-precondition",
      "La facturation publique Chorus Pro nécessite un numéro d'engagement budgétaire."
    );
  }

  const orderRef = db.collection("orders").doc();
  const orderId = orderRef.id;

  try {
    await db.runTransaction(async (transaction) => {
      let globalTotalAmount = 0;
      const productSnaps = [];

      for (const item of cartItems) {
        if (!item.id) {
          throw new HttpsError("invalid-argument", "Un article du panier ne possède pas d'identifiant valide.");
        }
        const productRef = db.collection("products").doc(item.id);
        const snap = await transaction.get(productRef);
        if (!snap.exists) {
          throw new HttpsError("not-found", `Le produit demandé n'est plus disponible en stock.`);
        }
        productSnaps.push({ item, productRef, snap });
      }

      for (const { item, snap } of productSnaps) {
        const productData = snap.data();
        const currentStock = Number(productData.stock || 0);
        const requestedQty = Number(item.quantity || 1);

        if (currentStock < requestedQty) {
          throw new HttpsError(
            "out-of-range",
            `Stock insuffisant pour "${productData.title || productData.name || "produit"}". Disponible : ${currentStock}`
          );
        }

        const unitPriceHT = Number(
          productData.priceHT ?? productData.price ?? item.priceHT ?? item.price ?? 0
        );
        globalTotalAmount += unitPriceHT * requestedQty;
      }

      for (const { item, productRef, snap } of productSnaps) {
        const productData = snap.data();
        const currentStock = Number(productData.stock || 0);
        const requestedQty = Number(item.quantity || 1);
        const newStock = currentStock - requestedQty;

        transaction.update(productRef, {
          stock: newStock,
          isAvailable: newStock > 0,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Enregistrement de la commande principale avec buyerEmail
      const globalOrder = {
        id: orderId,
        buyerId: auth.uid,
        buyerEmail: profile.email || auth.token?.email || "",
        buyerName: profile.companyName || profile.displayName || "Acheteur",
        buyerRole: profile.role || "acheteur_prive",
        siretBuyer: profile.siret || "-",
        refEngagement: options.refEngagement || "-",
        paymentMethod: paymentMethod,
        totalAmount: globalTotalAmount,
        status: "A_PREPARER",
        deliveryDetails: options.deliveryDetails || {},
        deliveryAddress: options.deliveryAddress || profile.address || "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.title || item.name || "Produit",
          price: Number(item.priceHT ?? item.price ?? 0),
          quantity: Number(item.quantity || 1),
          producerId: item.producerId || "",
          producerName: item.producerName || "Maraîcher",
          producerEmail: item.producerEmail || "",
        })),
      };

      transaction.set(orderRef, globalOrder);

      const itemsByProducer = cartItems.reduce((acc, item) => {
        const pId = item.producerId || "PROD_INCONNU";
        if (!acc[pId]) {
          acc[pId] = {
            producerName: item.producerName || "Maraîcher",
            producerEmail: item.producerEmail || "",
            items: [],
            totalAmount: 0,
          };
        }
        const unitPrice = Number(item.priceHT ?? item.price ?? 0);
        const qty = Number(item.quantity || 1);
        acc[pId].items.push(item);
        acc[pId].totalAmount += unitPrice * qty;
        return acc;
      }, {});

      for (const [producerId, group] of Object.entries(itemsByProducer)) {
        const subOrderRef = db.collection("sub_orders").doc();
        transaction.set(subOrderRef, {
          id: subOrderRef.id,
          parentOrderId: orderId,
          producerId: producerId,
          producerName: group.producerName,
          producerEmail: group.producerEmail,
          buyerId: auth.uid,
          buyerName: globalOrder.buyerName,
          buyerEmail: globalOrder.buyerEmail,
          status: "A_PREPARER",
          amount: group.totalAmount,
          items: group.items,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("Erreur critique lors de la transaction d'achat :", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      error.message || "Échec interne lors de la sécurisation de la commande."
    );
  }
});

// 6. Déclencheur Firestore (Envoi d'e-mails Brevo + PDF)
const onOrderCreatedTrigger = onDocumentCreated(
  {
    document: "orders/{orderId}",
    database: "ane-et-gorille-v2",
    region: "europe-west9",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const orderData = snap.data();
    const orderId = event.params.orderId;

    console.log(`📦 Nouvelle commande détectée [ID: ${orderId}] — Traitement e-mails Brevo...`);

    try {
      const buyerEmail = orderData.buyerEmail || orderData.customerEmail;
      if (buyerEmail) {
        let bcPdfBuffer = null;
        if (typeof generateOrderPdf === "function") {
          try {
            bcPdfBuffer = await generateOrderPdf({ id: orderId, ...orderData });
          } catch (pdfErr) {
            console.error(`❌ Erreur génération PDF BC pour #${orderId}:`, pdfErr);
          }
        }

        await sendOrderConfirmation(buyerEmail, orderId, bcPdfBuffer);
      }

      const subOrdersSnap = await db
        .collection("sub_orders")
        .where("parentOrderId", "==", orderId)
        .get();

      if (!subOrdersSnap.empty) {
        for (const subDoc of subOrdersSnap.docs) {
          const subOrderData = subDoc.data();
          if (subOrderData.producerEmail) {
            let bpPdfBuffer = null;
            if (typeof generateSubOrderPdf === "function") {
              try {
                bpPdfBuffer = await generateSubOrderPdf(subOrderData);
              } catch (pdfErr) {
                console.error(`❌ Erreur génération PDF BP pour sub_order #${subDoc.id}:`, pdfErr);
              }
            }

            await sendHarvestAlertToProducer(
              subOrderData.producerEmail,
              subDoc.id,
              subOrderData.producerName,
              bpPdfBuffer
            );
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement e-mail/PDF pour la commande #${orderId} :`, error);
    }
  }
);

// EXPORTATIONS OFFICIELLES DU CLOUD
exports.checkGeoFenceServer = checkGeoFenceServer;
exports.createPaymentIntentServer = createPaymentIntentServer;                     // 👈 Export Carte Bancaire
exports.createSepaSetupIntentServer = createSepaSetupIntentServer;                   // 👈 Export SEPA
exports.createStripeConnectAccountServer = createStripeConnectAccountServer;         // 👈 Export Stripe Connect
exports.confirmBankTransferOrderServer = confirmBankTransferOrderServer;             // 👈 Export Virement
exports.dispatchMultiProducerTransfersServer = dispatchMultiProducerTransfersServer; // 👈 Export Ventilation
exports.scheduledSepaChargeServer = scheduledSepaChargeServer;                       // 👈 Export Cron SEPA
exports.calculateDeliverySlotsServer = calculateDeliverySlotsServer;
exports.getAdminDashboardStatsServer = getAdminDashboardStatsServer;
exports.processCheckoutServer = processCheckoutServer;
exports.onOrderCreatedTrigger = onOrderCreatedTrigger;
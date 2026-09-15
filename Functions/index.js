/**
 * 🚀 POINT D'ENTRÉE FAÇADE DU BACKEND ÂNE & GORILLE
 * Architecture v2 - Google Cloud Functions (europe-west9) - Base: ane-et-gorille-v2
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Définition globale de la région pour toutes les fonctions Cloud
setGlobalOptions({ region: "europe-west9" });

if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialisation officielle sur la base Firestore dédiée "ane-et-gorille-v2"
const db = getFirestore(admin.app(), "ane-et-gorille-v2");

// 1. Module Authentification & Contrôle Territorial
const { checkGeoFenceServer } = require("./src/auth/auth.functions");

// 2. Module Paiements (Stripe SEPA, Stripe Connect Express, Intention CB & Virement B2B/B2G)
const {
  createSepaSetupIntentServer,
  createStripeConnectAccountServer,
  confirmBankTransferOrderServer,
  createPaymentIntentServer, // 👈 AJOUTÉ : Indispensable pour la création de la transaction Stripe !
} = require("./src/payments/payments.functions");

// 3. Module Logistique & Tournées Mutualisées
const { calculateDeliverySlotsServer } = require("./src/logistics/logistics.functions");

// 4. Module Administration & Surveillance
const { getAdminDashboardStatsServer } = require("./src/admin/admin.functions");

// 5. Module Commandes & Checkout Sécurisé (Transaction Atomique & Stocks)
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

  // Prise en compte prioritaire du mode de paiement choisi au checkout
  const paymentMethod =
    options.paymentMethod || (isPublicSector ? "chorus_mandate" : "stripe_card");

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

      // 1. LECTURES STRICTES (Obligatoire dans Firestore)
      for (const item of cartItems) {
        if (!item.id) {
          throw new HttpsError(
            "invalid-argument",
            "Un article du panier ne possède pas d'identifiant valide."
          );
        }
        const productRef = db.collection("products").doc(item.id);
        const snap = await transaction.get(productRef);
        if (!snap.exists) {
          throw new HttpsError(
            "not-found",
            `Le produit "${item.title || item.name || 'sélectionné'}" n'est plus disponible en stock.`
          );
        }
        productSnaps.push({ item, productRef, snap });
      }

      // 2. VÉRIFICATION DES STOCKS & CALCUL SERVEUR INVIOLABLE
      for (const { item, snap } of productSnaps) {
        const productData = snap.data();
        const currentStock = Number(productData.stock || 0);
        const requestedQty = Number(item.quantity || 1);

        if (currentStock < requestedQty) {
          throw new HttpsError(
            "out-of-range",
            `Stock insuffisant pour "${productData.title || productData.name || 'produit'}". Disponible : ${currentStock}`
          );
        }

        const unitPriceHT = Number(
          productData.priceHT ?? productData.price ?? item.priceHT ?? item.price ?? 0
        );
        globalTotalAmount += unitPriceHT * requestedQty;
      }

      // 3. ÉCRITURES ATOMIQUES (Décrémentation des stocks)
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

      // 4. CRÉATION DE LA COMMANDE GLOBALE
      const globalOrder = {
        id: orderId,
        buyerId: auth.uid,
        buyerName: profile.companyName || profile.displayName || "Acheteur",
        buyerRole: profile.role || "acheteur_prive",
        siretBuyer: profile.siret || "-",
        refEngagement: options.refEngagement || "-",
        paymentMethod: paymentMethod,
        paymentIntentId: options.paymentIntentId || null,
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
        })),
      };

      transaction.set(orderRef, globalOrder);

      // 5. CRÉATION DES SOUS-COMMANDES MARAÎCHÈRES (Bons de Préparation)
      const itemsByProducer = cartItems.reduce((acc, item) => {
        const pId = item.producerId || "PROD_INCONNU";
        if (!acc[pId]) {
          acc[pId] = {
            producerName: item.producerName || "Maraîcher",
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
          buyerId: auth.uid,
          buyerName: globalOrder.buyerName,
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

// 🚀 EXPORTATIONS OFFICIELLES DU CLOUD (7 Fonctions V2)
exports.checkGeoFenceServer = checkGeoFenceServer;
exports.createSepaSetupIntentServer = createSepaSetupIntentServer;
exports.createStripeConnectAccountServer = createStripeConnectAccountServer;
exports.confirmBankTransferOrderServer = confirmBankTransferOrderServer;
exports.createPaymentIntentServer = createPaymentIntentServer; // 👈 EXPORTÉ OFFICIELLEMENT
exports.calculateDeliverySlotsServer = calculateDeliverySlotsServer;
exports.getAdminDashboardStatsServer = getAdminDashboardStatsServer;
exports.processCheckoutServer = processCheckoutServer;
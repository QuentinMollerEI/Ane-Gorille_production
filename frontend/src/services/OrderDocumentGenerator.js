import { db } from "../../../services/firestore.service.js";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";

/**
 * Service de gestion des commandes "Legal by Design"
 * Gère la découpe atomique des paniers multi-producteurs en sous-commandes (Bons de Préparation)
 * et met à jour les stocks dans Firestore de manière sécurisée.
 */
export const OrderDocumentGenerator = {
  /**
   * Crée la commande globale et les bons de préparation producteurs associés
   * @param {Array} cartItems - Liste des articles dans le panier
   * @param {Object} currentUser - Utilisateur connecté (Acheteur)
   * @param {Object} checkoutData - Données du formulaire (Adresse, SIRET, Engagement public...)
   * @param {String} paymentMethod - 'stripe' (B2C), 'billie' (B2B) ou 'mandat' (B2G)
   * @param {Object} paymentResult - Métadonnées retournées par Stripe ou Billie (ex: paymentIntentId)
   */
  async generateOrderDocuments(
    cartItems,
    currentUser,
    checkoutData,
    paymentMethod,
    paymentResult = {},
  ) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Le panier est vide. Impossible de générer la commande.");
    }

    const batch = writeBatch(db);
    const orderId = doc(collection(db, "orders")).id;
    const globalOrderRef = doc(db, "orders", orderId);

    // 1. Regroupement des articles par producteur pour les Bons de Préparation
    const itemsByProducer = cartItems.reduce((acc, item) => {
      const pId = item.producerId || "ID_PRODUCTEUR_TEST";
      if (!acc[pId]) {
        acc[pId] = {
          producerId: pId,
          producerName: item.producerName || "Producteur local",
          items: [],
          totalHT: 0,
          totalTTC: 0,
          totalVAT: 0,
        };
      }

      const qty = parseInt(item.quantityWanted || 1, 10);
      const priceHT = parseFloat(item.priceHT || 0);
      const vatRate = parseFloat(item.vatRate || 5.5);

      const itemHT = priceHT * qty;
      const itemVAT = itemHT * (vatRate / 100);
      const itemTTC = itemHT + itemVAT;

      acc[pId].items.push({
        productId: item.id,
        name: item.title || item.name,
        category: item.category || "Légumes",
        quantity: qty,
        unit: item.unit || "kg",
        priceHT: priceHT,
        vatRate: vatRate,
        priceTTC: priceHT * (1 + vatRate / 100),
        // Données légales de traçabilité HACCP et loi AGEC
        batchNumber: item.batchNumber || "N/A",
        harvestDate: item.harvestDate || "N/A",
        iduAdeme: item.iduAdeme || "N/A",
        origin: item.origin || "France",
        department: item.department || "N/A",
        distanceKm: parseInt(item.distanceKm || 0, 10),
      });

      acc[pId].totalHT += itemHT;
      acc[pId].totalVAT += itemVAT;
      acc[pId].totalTTC += itemTTC;

      return acc;
    }, {});

    // Calculs globaux pour l'acheteur (Facturation globale)
    let globalTotalHT = 0;
    let globalTotalVAT = 0;
    let globalTotalTTC = 0;

    Object.values(itemsByProducer).forEach((p) => {
      globalTotalHT += p.totalHT;
      globalTotalVAT += p.totalVAT;
      globalTotalTTC += p.totalTTC;
    });

    // 2. Préparation du document Commande Globale (Bon de Commande Client)
    const globalOrderData = {
      orderId: orderId,
      createdAt: serverTimestamp(),
      buyerId: currentUser?.uid || "INVITE_TEST",
      buyerName:
        currentUser?.displayName || checkoutData.billingName || "Client local",
      buyerEmail: currentUser?.email || checkoutData.billingEmail || "",
      buyerProfile: checkoutData.buyerProfile || "B2C", // B2C, B2B, B2G
      deliveryAddress: checkoutData.deliveryAddress || "",

      // Totaux financiers agrégés
      totalHT: parseFloat(globalTotalHT.toFixed(2)),
      totalVAT: parseFloat(globalTotalVAT.toFixed(2)),
      totalTTC: parseFloat(globalTotalTTC.toFixed(2)),

      // Ventilation des taxes par taux pour conformité comptable
      vatBreakdown: this._calculateVatBreakdown(cartItems),

      // Informations de paiement réglementaires
      payment: {
        method: paymentMethod, // 'stripe', 'billie', 'mandat_public'
        status:
          paymentMethod === "mandat_public" ? "A_FACTURE_CHORUS" : "COMPLETE",
        stripePaymentIntentId: paymentResult.stripePaymentIntentId || null,
        billieInvoiceReference: paymentResult.billieInvoiceReference || null,
        publicEngagementNumber: checkoutData.engagementNumber || null, // Requis Chorus Pro (B2G)
        siretBuyer: checkoutData.siretBuyer || null, // Requis B2B / B2G
      },

      // Liste de tous les produits commandés (synthèse)
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.title || item.name,
        quantity: parseInt(item.quantityWanted || 1, 10),
        unit: item.unit || "kg",
        priceHT: parseFloat(item.priceHT || 0),
        vatRate: parseFloat(item.vatRate || 5.5),
        producerName: item.producerName || "Producteur local",
      })),
    };

    // Enregistrement de la commande globale
    batch.set(globalOrderRef, globalOrderData);

    // 3. Génération des sous-commandes (Bons de Préparation Producteurs)
    Object.values(itemsByProducer).forEach((prodOrder) => {
      const subOrderId = doc(collection(db, "sub_orders")).id;
      const subOrderRef = doc(db, "sub_orders", subOrderId);

      const subOrderData = {
        subOrderId: subOrderId,
        parentOrderId: orderId,
        createdAt: serverTimestamp(),
        producerId: prodOrder.producerId,
        producerName: prodOrder.producerName,
        buyerId: globalOrderData.buyerId,
        buyerName: globalOrderData.buyerName,
        deliveryAddress: globalOrderData.deliveryAddress,

        // Données financières spécifiques au producteur (pour ventilation Stripe Connect)
        totalHT: parseFloat(prodOrder.totalHT.toFixed(2)),
        totalVAT: parseFloat(prodOrder.totalVAT.toFixed(2)),
        totalTTC: parseFloat(prodOrder.totalTTC.toFixed(2)),

        // Statut logistique HACCP
        status: "A_PREPARER", // A_PREPARER, PRET_A_EXPEDIER, EN_LIVRAISON, LIVRE, INCIDENT

        // Articles spécifiques à ce producteur avec données de traçabilité obligatoires
        items: prodOrder.items,
      };

      batch.set(subOrderRef, subOrderData);

      // 4. Décrémentation dynamique des stocks de chaque produit (sécurité anti-surcharges)
      prodOrder.items.forEach((item) => {
        const productRef = doc(db, "products", item.productId);
        batch.update(productRef, {
          stock: increment(-item.quantity), // Déduction en temps réel dans Firestore
        });
      });
    });

    // Validation unifiée de la transaction Firestore
    await batch.commit();

    return {
      orderId,
      totals: {
        totalHT: globalOrderData.totalHT,
        totalVAT: globalOrderData.totalVAT,
        totalTTC: globalOrderData.totalTTC,
      },
      producersConcernedCount: Object.keys(itemsByProducer).length,
    };
  },

  /**
   * Calcule la ventilation de la TVA par taux pour la facture finale
   * @private
   */
  _calculateVatBreakdown(cartItems) {
    const breakdown = {};
    cartItems.forEach((item) => {
      const rate = parseFloat(item.vatRate || 5.5).toFixed(1);
      const qty = parseInt(item.quantityWanted || 1, 10);
      const ht = parseFloat(item.priceHT || 0) * qty;
      const vat = ht * (parseFloat(rate) / 100);

      if (!breakdown[rate]) {
        breakdown[rate] = { baseHT: 0, vatAmount: 0 };
      }
      breakdown[rate].baseHT += ht;
      breakdown[rate].vatAmount += vat;
    });

    // Arrondir proprement les totaux de TVA
    Object.keys(breakdown).forEach((rate) => {
      breakdown[rate].baseHT = parseFloat(breakdown[rate].baseHT.toFixed(2));
      breakdown[rate].vatAmount = parseFloat(
        breakdown[rate].vatAmount.toFixed(2),
      );
    });

    return breakdown;
  },
};

import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firestore.service.js";

/**
 * 💼 SERVICE : OrderDocumentGenerator.js ("Legal by Design") - v6 (Hautement Résilient)
 * Centralise la création atomique des Commandes (collection 'orders') et
 * des Bons de Préparation Multi-Producteurs (collection 'sub_orders') dans Firestore.
 *
 * ÉVOLUTION v6 : Traitement 100% synchrone, ultra-rapide et sécurisé en hangar.
 * Résout le problème de blocage asynchrone et gère robustement les formats d'ID.
 */
export const OrderDocumentGenerator = {
  /**
   * Génère les documents comptables et logistiques à la validation du panier.
   *
   * @param {Array} cartItems - Les articles présents dans le panier
   * @param {Object} user - L'utilisateur connecté (peut être null en mode invité)
   * @param {Object} checkoutData - Informations complémentaires saisies (adresse, SIRET, N° engagement)
   * @param {String} paymentMethod - Méthode de paiement ('stripe' | 'billie' | 'mandat_public')
   * @param {Object} paymentResult - Métadonnées associées de l'interfaçage financier
   * @returns {Object} Un objet contenant l'ID de la commande générée
   */
  generateOrderDocuments: async (
    cartItems,
    user,
    checkoutData,
    paymentMethod,
    paymentResult,
  ) => {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Le panier est vide. Impossible de générer la commande.");
    }

    // 1. Initialisation du Batch Firestore pour une écriture atomique
    const batch = writeBatch(db);

    // 2. Préparation des références et génération des IDs uniques
    const ordersCollection = collection(db, "orders");
    const subOrdersCollection = collection(db, "sub_orders");

    const orderDocRef = doc(ordersCollection);
    const globalOrderId = orderDocRef.id;
    const humanReadableOrderId =
      "CMD-" + globalOrderId.substring(0, 8).toUpperCase();

    // 3. Calculs financiers isolés et groupement par Producteur
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    const producersMap = {};

    cartItems.forEach((item) => {
      const qty = parseInt(item.quantityWanted || item.qty || 1, 10);
      const priceHT = parseFloat(item.priceHT || item.price || 0);
      const vatRate = parseFloat(item.vatRate || item.vat || 5.5);

      const itemHT = priceHT * qty;
      const itemVAT = itemHT * (vatRate / 100);
      const itemTTC = itemHT + itemVAT;

      totalHT += itemHT;
      totalTVA += itemVAT;
      totalTTC += itemTTC;

      // Isolation par producteur
      const producerId = item.producerId || "ID_PRODUCTEUR_TEST";
      const producerName =
        item.producerName || item.producer || "Producteur local";

      if (!producersMap[producerId]) {
        producersMap[producerId] = {
          producerId,
          producerName,
          items: [],
          totalHT: 0,
          totalTVA: 0,
          totalTTC: 0,
        };
      }

      producersMap[producerId].items.push({
        productId: item.productId || item.id,
        name: item.title || item.name || "Produit sans nom",
        quantity: qty,
        unit: item.unit || "kg",
        priceHT: priceHT,
        vatRate: vatRate,
        batchNumber: item.batchNumber || "",
      });

      producersMap[producerId].totalHT += itemHT;
      producersMap[producerId].totalTVA += itemVAT;
      producersMap[producerId].totalTTC += itemTTC;
    });

    // 4. Construction de la Commande Globale (orders)
    const globalOrderData = {
      id: globalOrderId,
      orderId: humanReadableOrderId,
      buyerId: user?.uid || "GUEST",
      buyerName: checkoutData.billingName || "Client Professionnel",
      buyerEmail: checkoutData.billingEmail || "client@ane-et-gorille.fr",
      buyerProfile: checkoutData.buyerProfile || "B2B",
      siretBuyer: checkoutData.siretBuyer || checkoutData.siret || null,
      engagementNumber: checkoutData.engagementNumber || null,
      deliveryAddress:
        checkoutData.deliveryAddress ||
        "Livraison standard boutique de retrait",
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "stripe" ? "PAID" : "A_ECHEANCE",
      paymentDetails: paymentResult || null,
      totalHT: Number(totalHT.toFixed(2)),
      totalTVA: Number(totalTVA.toFixed(2)),
      totalTTC: Number(totalTTC.toFixed(2)),
      status: "A_PREPARER",
      createdAt: serverTimestamp(),
      items: cartItems.map((item) => ({
        productId: item.productId || item.id,
        title: item.title || item.name || "Produit sans nom",
        priceHT: parseFloat(item.priceHT || item.price || 0),
        vatRate: parseFloat(item.vatRate || item.vat || 5.5),
        qty: parseInt(item.quantityWanted || item.qty || 1, 10),
        unit: item.unit || "kg",
        producerId: item.producerId || "ID_PRODUCTEUR_TEST",
        producerName: item.producerName || item.producer || "Producteur local",
      })),
    };

    // Ajout de la commande globale au batch
    batch.set(orderDocRef, globalOrderData);

    // 5. Construction de chaque Bon de Préparation Maraîcher (sub_orders)
    Object.keys(producersMap).forEach((producerId) => {
      const producerData = producersMap[producerId];
      const subOrderDocRef = doc(subOrdersCollection);
      const subOrderId = subOrderDocRef.id;
      const humanReadableSubOrderId =
        "BPR-" + subOrderId.substring(0, 8).toUpperCase();

      const subOrderData = {
        id: subOrderId,
        subOrderId: humanReadableSubOrderId,
        orderId: globalOrderId,
        parentOrderId: humanReadableOrderId,
        producerId: producerId,
        producerName: producerData.producerName,
        buyerId: user?.uid || "GUEST",
        buyerName: checkoutData.billingName || "Client Professionnel",
        deliveryAddress:
          checkoutData.deliveryAddress ||
          "Livraison standard boutique de retrait",
        items: producerData.items,
        totalHT: Number(producerData.totalHT.toFixed(2)),
        totalTVA: Number(producerData.totalTVA.toFixed(2)),
        totalTTC: Number(producerData.totalTTC.toFixed(2)),
        status: "A_PREPARER",
        createdAt: serverTimestamp(),
      };

      batch.set(subOrderDocRef, subOrderData);
    });

    // 6. Décrémentation atomique des stocks dans Firestore
    cartItems.forEach((item) => {
      const qty = parseInt(item.quantityWanted || item.qty || 1, 10);
      const itemId = item.productId || item.id;
      if (!itemId) {
        console.warn(
          "⚠️ Impossible de décrémenter le stock : identifiant d'article manquant.",
          item,
        );
        return;
      }
      const productDocRef = doc(db, "products", itemId);

      batch.update(productDocRef, {
        stock: increment(-qty),
      });
    });

    // 7. Validation et exécution de l'écriture en une transaction unique
    try {
      await batch.commit();
      console.log(
        `🎉 Commande ${humanReadableOrderId} et sous-commandes créées avec succès dans Firestore !`,
      );
      return {
        orderId: humanReadableOrderId,
        id: globalOrderId,
        totalTTC: totalTTC,
      };
    } catch (error) {
      console.error(
        "❌ Erreur critique lors de la transaction Firestore de commande :",
        error,
      );
      throw new Error(
        "Impossible de valider votre commande en base de données. Transaction annulée.",
      );
    }
  },
};

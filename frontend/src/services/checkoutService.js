import { db } from "./firestore.service";
// centralisation des instances pour éviter les conflits sous Vite
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

/**
 * UTITLITAIRE RECURSIF DE SÉCURISATION (Anti-Crash Firestore)
 * Parcourt récursivement l'ensemble des objets et remplace toutes les clés
 * égales à 'undefined' par 'null' pour éviter d'essuyer un rejet d'écriture strict de Firestore.
 */
const sanitizeData = (obj) => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeData(item));
  }
  if (typeof obj === "object") {
    if (
      obj.constructor &&
      obj.constructor.name &&
      obj.constructor.name.includes("FieldValue")
    ) {
      return obj;
    }
    if (obj._methodName) {
      return obj;
    }
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      cleaned[key] = sanitizeData(obj[key]);
    });
    return cleaned;
  }
  return obj;
};

/**
 * SERVICE DE COMMANDE & DE GÉNÉRATION DE DOCUMENTS (PRODUCTION REELLE - AVEC DETAILS DES PRODUITS RACINE)
 *
 * Ce service est appelé au moment où l'acheteur valide son panier.
 * Résout l'erreur de permissions et le crash de transaction en exécutant d'abord toutes les lectures.
 * Ajoute également la liste réelle des produits de la commande directement au document parent dans /orders
 * pour que l'acheteur puisse voir son panier réel sans fallback statique.
 */
export const CheckoutService = {
  async validateAndCreateOrder(buyerInfo, cartItems, paymentMethod) {
    if (!buyerInfo?.uid || !cartItems?.length) {
      throw new Error("Données d'achat ou de panier manquantes.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    // Calcul du montant total de la commande
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = Number(item.priceHT ?? item.price ?? 0);
      const qty = Number(item.quantity ?? item.qty ?? 1);
      return sum + price * qty;
    }, 0);

    // Groupement des articles par producteur pour les sous-commandes (Bons de Préparation - BP)
    const itemsByProducer = cartItems.reduce((groups, item) => {
      const pId = item.producerId || "PROD_INCONNU";
      if (!groups[pId]) {
        groups[pId] = {
          producerId: pId,
          producerName: item.producerName || "Producteur local",
          items: [],
        };
      }
      groups[pId].items.push(item);
      return groups;
    }, {});

    // 🎯 TRANSACTION ATOMIQUE UNIFIÉE (Lectures STRICTEMENT avant Écritures)
    await runTransaction(db, async (transaction) => {
      const productSnaps = [];

      // =========================================================================
      // ÉTAPE 1 : TOUTES LES LECTURES (READS ONLY)
      // =========================================================================
      for (const item of cartItems) {
        if (!item.id) continue;
        const productRef = doc(db, "products", item.id);
        const productSnap = await transaction.get(productRef); // Lecture unique

        productSnaps.push({
          item,
          productRef,
          productSnap,
        });
      }

      // =========================================================================
      // ÉTAPE 2 : TOUTES LES VÉRIFICATIONS MÉTIER & VALIDATIONS
      // =========================================================================
      for (const { item, productSnap } of productSnaps) {
        if (!productSnap.exists()) {
          throw new Error(
            `Le produit "${item.title || item.name || "Inconnu"}" n'existe plus en base de données.`,
          );
        }

        const currentStock = Number(productSnap.data().stock || 0);
        const requestedQty = Number(item.quantity ?? item.qty ?? 1);

        if (currentStock < requestedQty) {
          throw new Error(
            `Stock insuffisant pour le produit "${item.title || item.name}". Disponible : ${currentStock}, Demandé : ${requestedQty}`,
          );
        }
      }

      // =========================================================================
      // ÉTAPE 3 : TOUTES LES ÉCRITURES (WRITES ONLY)
      // =========================================================================

      // A. Décrémentation physique du stock de chaque produit
      for (const { item, productRef, productSnap } of productSnaps) {
        const currentStock = Number(productSnap.data().stock || 0);
        const requestedQty = Number(item.quantity ?? item.qty ?? 1);

        transaction.update(productRef, {
          stock: currentStock - requestedQty,
        });
      }

      // B. Écriture de la commande globale parente (/orders) avec l'array de produits réels !
      const orderPayload = sanitizeData({
        id: orderId,
        buyerId: buyerInfo.uid,
        buyerName: buyerInfo.name || buyerInfo.displayName || "Acheteur",
        buyerRole: buyerInfo.role || "client_prive",
        buyerSiret: buyerInfo.siret || "-",
        buyerCodeService: buyerInfo.codeService || "-",
        refEngagement: buyerInfo.refEngagement || "-",
        paymentMethod: paymentMethod,
        totalAmount: totalAmount,
        status: "A_PREPARER",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tempHaccp: null,
        carrierId: null,
        carrierName: null,
        // On stocke les items réels directement ici pour le Suivi de Commande
        items: cartItems.map((item) => ({
          id: item.id || null,
          name: item.title || item.name || "Produit de saison",
          price: Number(item.priceHT ?? item.price ?? 0),
          quantity: Number(item.quantity ?? item.qty ?? 1),
          vatRate: item.vatRate || 5.5,
          producerId: item.producerId || "PROD_INCONNU",
          producerName: item.producerName || "Producteur local",
        })),
      });
      transaction.set(orderRef, orderPayload);

      // C. Écriture du Bon de Commande (BC) dans la sous-collection d'audit (/orders/{orderId}/documents)
      const bcDocId = `BC-${orderId.slice(0, 8).toUpperCase()}`;
      const bcRef = doc(collection(db, `orders/${orderId}/documents`));

      const bcPayload = sanitizeData({
        id: bcDocId,
        orderId: orderId,
        buyerId: buyerInfo.uid,
        buyerName: buyerInfo.name || buyerInfo.displayName || "Acheteur",
        buyerRole: buyerInfo.role || "client_prive",
        type: "Bon de commande",
        createdAt: serverTimestamp(),
        entity: "Plateforme Âne et Gorille",
        amount: totalAmount,
        vatRate: 5.5,
        status: "paid",
        refEngagement: buyerInfo.refEngagement || "-",
        items: cartItems.map((item) => ({
          name: item.title || item.name || "Produit",
          price: Number(item.priceHT ?? item.price ?? 0),
          quantity: Number(item.quantity ?? item.qty ?? 1),
          vatRate: item.vatRate || 5.5,
        })),
      });
      transaction.set(bcRef, bcPayload);

      // D. Écriture des Bons de Préparation (BP) individuels pour chaque maraîcher (/sub_orders)
      Object.keys(itemsByProducer).forEach((producerId) => {
        const subOrderRef = doc(collection(db, "sub_orders"));
        const producerData = itemsByProducer[producerId];
        const bpTotal = producerData.items.reduce((sum, item) => {
          const price = Number(item.priceHT ?? item.price ?? 0);
          const qty = Number(item.quantity ?? item.qty ?? 1);
          return sum + price * qty;
        }, 0);

        const bpPayload = sanitizeData({
          id: subOrderRef.id,
          parentOrderId: orderId,
          buyerId: buyerInfo.uid,
          buyerName: buyerInfo.name || "Acheteur",
          producerId: producerId,
          producerName: producerData.producerName,
          items: producerData.items.map((item) => ({
            id: item.id,
            name: item.title || item.name || "Produit",
            price: Number(item.priceHT ?? item.price ?? 0),
            quantity: Number(item.quantity ?? item.qty ?? 1),
            vatRate: item.vatRate || 5.5,
            producerId: producerId,
            producerName: producerData.producerName,
          })),
          amount: bpTotal,
          status: "A_PREPARER",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(subOrderRef, bpPayload);
      });
    });

    return orderId;
  },
};

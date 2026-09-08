import { db } from "./firestore.service.js";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";

export const DocumentWorkflowService = {
  async createOrderAndBps(buyerInfo, cartItems, paymentMethod, checkoutData) {
    if (!buyerInfo?.uid || !cartItems?.length) {
      throw new Error(
        "Données de commande insuffisantes pour initialiser le flux.",
      );
    }

    const batch = writeBatch(db);

    // 1. Initialisation des Références
    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    // Calculs financiers globaux
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Groupement des articles par Maraîcher (Producer)
    const itemsByProducer = cartItems.reduce((groups, item) => {
      if (!groups[item.producerId]) {
        groups[item.producerId] = {
          producerName: item.producerName,
          items: [],
        };
      }
      groups[item.producerId].items.push(item);
      return groups;
    }, {});

    // 2. Écriture de la commande parente (orders)
    batch.set(orderRef, {
      id: orderId,
      buyerId: buyerInfo.uid,
      buyerName:
        checkoutData.companyName ||
        buyerInfo.displayName ||
        "Acheteur Professionnel",
      buyerRole: buyerInfo.role || "acheteur",
      buyerSiret: checkoutData.siret || "-",
      buyerCodeService: checkoutData.codeService || "-",
      refEngagement: checkoutData.refEngagement || "-",
      paymentMethod: paymentMethod, // 'stripe' (Privé) ou 'mandat' (Public/Chorus Pro)
      totalAmount: Number(totalAmount.toFixed(2)),
      status: "A_PREPARER",
      createdAt: serverTimestamp(),
      tempHaccp: null,
      carrierId: null,
      carrierName: null,
      // ⚠️ IMPORTANT : On ne met pas de updatedAt ici pour la création initiale
    });

    // 3. Écriture du Bon de Commande DANS LA SOUS-COLLECTION (Corrige l'erreur "documents" à la racine)
    const humanOrderId = `BC-${orderId.slice(0, 8).toUpperCase()}`;
    const bcRef = doc(db, "orders", orderId, "documents", humanOrderId);

    batch.set(bcRef, {
      id: humanOrderId,
      orderId: orderId,
      type: "Bon de commande",
      createdAt: serverTimestamp(),
      entity: "Plateforme Âne et Gorille",
      amount: Number(totalAmount.toFixed(2)),
      vatRate: 5.5,
      status: paymentMethod === "stripe" ? "paid" : "pending_30d",
      refEngagement: checkoutData.refEngagement || "-",
    });

    // 4. Création des Bons de Préparation (sub_orders) pour chaque maraîcher
    Object.entries(itemsByProducer).forEach(([producerId, data]) => {
      const subOrderRef = doc(collection(db, "sub_orders"));
      const bpTotal = data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      batch.set(subOrderRef, {
        id: subOrderRef.id,
        parentOrderId: orderId,
        buyerId: buyerInfo.uid,
        buyerName:
          checkoutData.companyName || buyerInfo.displayName || "Acheteur",
        producerId: producerId,
        producerName: data.producerName,
        items: data.items,
        amount: Number(bpTotal.toFixed(2)),
        status: "A_PREPARER",
        createdAt: serverTimestamp(),
      });
    });

    // 5. Décrémentation stricte des stocks (Corrige l'erreur permission-denied)
    cartItems.forEach((item) => {
      const productRef = doc(db, "products", item.id);

      // ⚠️ IMPORTANT : On n'envoie QUE 'stock'. Le fait d'ajouter 'updatedAt'
      // ici déclenchait le bouclier de sécurité de Firestore !
      batch.update(productRef, {
        stock: increment(-item.quantity),
      });
    });

    // 6. Exécution de la transaction
    try {
      await batch.commit();
      return orderId;
    } catch (error) {
      console.error("Erreur critique lors de la validation :", error);
      throw new Error("Impossible de valider la commande.");
    }
  },
};

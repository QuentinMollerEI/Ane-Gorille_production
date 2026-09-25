import { db } from "../config/firebase.js";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";

/**
 * 📦 ORDER WORKFLOW SERVICE
 * Source de vérité unique pour le cycle de vie des commandes :
 * A_PREPARER -> EN_PREPARATION -> A_RAMASSER -> EN_COURS_DE_LIVRAISON -> LIVRE
 */
export const OrderWorkflowService = {
  // --- OUTILS PRODUCTEUR ---
  async markAsInPreparation(subOrderId) {
    const subRef = doc(db, "sub_orders", subOrderId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(subRef);
      if (!snap.exists()) throw new Error("Sous-commande introuvable.");
      
      transaction.update(subRef, {
        status: "EN_PREPARATION",
        updatedAt: serverTimestamp()
      });
    });
    return true;
  },

  async markAsReadyForPickup(subOrderId, batchNumber, realWeightKg = null) {
    if (!batchNumber) throw new Error("Le numéro de lot HACCP (préfixé par L-) est obligatoire.");

    const subRef = doc(db, "sub_orders", subOrderId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(subRef);
      if (!snap.exists()) throw new Error("Sous-commande introuvable.");

      const payload = {
        status: "A_RAMASSER",
        batchNumber: batchNumber.startsWith("L-") ? batchNumber : `L-${batchNumber}`,
        updatedAt: serverTimestamp()
      };

      if (realWeightKg !== null) {
        payload.realWeightKg = Number(realWeightKg);
      }

      transaction.update(subRef, payload);
    });
    return true;
  },

  // --- OUTILS LIVREUR & TRANSPORT ---
  async markAsInTransit(subOrderIds, carrierUid, temperatureC) {
    const tempNum = Number(temperatureC);
    if (isNaN(tempNum) || tempNum < 10 || tempNum > 15) {
      throw new Error("Conformité HACCP : La température frigorifique de transit doit être comprise entre 10°C et 15°C.");
    }

    await runTransaction(db, async (transaction) => {
      for (const id of subOrderIds) {
        const subRef = doc(db, "sub_orders", id);
        transaction.update(subRef, {
          status: "EN_COURS_DE_LIVRAISON",
          carrierUid,
          pickupTemperatureC: tempNum,
          updatedAt: serverTimestamp()
        });
      }
    });
    return true;
  },

  // --- LIVRAISON FINALE & GÉNÉRATION FACTURES ---
  async markAsDelivered(orderId, podSignatureDataUrl, deliveryTemperatureC) {
    const tempNum = Number(deliveryTemperatureC);
    if (isNaN(tempNum) || tempNum < 10 || tempNum > 15) {
      throw new Error("Conformité HACCP : La température au déchargement doit être comprise entre 10°C et 15°C.");
    }

    const orderRef = doc(db, "orders", orderId);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("Commande principale introuvable.");

      const orderData = orderSnap.data();

      // Mettre à jour la commande principale
      transaction.update(orderRef, {
        status: "LIVRE",
        deliveryTemperatureC: tempNum,
        podSignatureUrl: podSignatureDataUrl,
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Mettre à jour toutes les sous-commandes associées
      const subQuery = query(collection(db, "sub_orders"), where("parentOrderId", "==", orderId));
      const subSnaps = await getDocs(subQuery);

      subSnaps.forEach((subDoc) => {
        transaction.update(subDoc.ref, {
          status: "LIVRE",
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const subData = subDoc.data();
        
        // Génération de la référence Factur-X
        const facVteRef = doc(collection(db, "documents"));
        transaction.set(facVteRef, {
          id: facVteRef.id,
          type: "FAC-VTE",
          orderId,
          subOrderId: subDoc.id,
          producerId: subData.producerId,
          producerName: subData.producerName,
          buyerId: orderData.buyerId,
          buyerName: orderData.buyerName,
          mandatMention: `Facture émise par Âne & Gorille au nom et pour le compte de ${subData.producerName}`,
          amountHT: subData.amountHT,
          createdAt: serverTimestamp()
        });

        // Facture de commission
        const facComRef = doc(collection(db, "documents"));
        transaction.set(facComRef, {
          id: facComRef.id,
          type: "FAC-COM",
          orderId,
          subOrderId: subDoc.id,
          producerId: subData.producerId,
          marketplaceCommissionHT: subData.marketplaceCommissionHT,
          legalMention: "TVA non applicable, art. 293 B du CGI",
          createdAt: serverTimestamp()
        });
      });
    });

    return true;
  }
};

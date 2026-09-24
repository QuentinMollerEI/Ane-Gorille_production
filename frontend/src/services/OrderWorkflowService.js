/**
 * 📦 SERVICE LOGISTIQUE : OrderWorkflowService.js
 * Emplacement : frontend/src/services/OrderWorkflowService.js
 * 
 * Rôle : Gère EXCLUSIVEMENT le cycle de vie POST-commande (Récolte, Ramassage, Livraison, Facturation).
 */
import { db } from "../config/firebase";
import { collection, doc, runTransaction, serverTimestamp, query, where, getDocs, getDoc } from "firebase/firestore";

export const OrderWorkflowService = {
  
  // ============================================================================
  // 🧑‍🌾 OUTILS PRODUCTEUR
  // ============================================================================

  async startHarvest(subOrderId) {
    if (!subOrderId) throw new Error("ID de sous-commande manquant.");
    const subRef = doc(db, "sub_orders", subOrderId);

    await runTransaction(db, async (transaction) => {
      const subSnap = await transaction.get(subRef);
      if (!subSnap.exists()) throw new Error("Sous-commande introuvable.");

      const subData = subSnap.data();
      transaction.update(subRef, {
        status: "EN_PREPARATION",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const parentOrderId = subData.parentOrderId || subData.orderId;
      if (parentOrderId) {
        transaction.update(doc(db, "orders", parentOrderId), {
          status: "EN_PREPARATION",
          updatedAt: serverTimestamp()
        });
      }
    });
  },

  async validatePreparation(subOrderId, lotNumber) {
    if (!subOrderId) throw new Error("ID de sous-commande manquant.");
    const defaultLot = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalLot = (lotNumber || defaultLot).trim();

    const subRef = doc(db, "sub_orders", subOrderId);

    await runTransaction(db, async (transaction) => {
      const subSnap = await transaction.get(subRef);
      if (!subSnap.exists()) throw new Error("Sous-commande introuvable.");
      
      const subData = subSnap.data();
      const parentOrderId = subData.parentOrderId || subData.orderId;

      transaction.update(subRef, {
        status: "A_RAMASSER",
        lotNumber: finalLot,
        batchNumber: finalLot,
        preparedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (parentOrderId) {
        const qSiblings = query(collection(db, "sub_orders"), where("parentOrderId", "==", parentOrderId));
        const snap = await getDocs(qSiblings);
        const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allReady = allSubs.length > 0 && allSubs.every(s => 
          s.id === subOrderId || ["A_RAMASSER", "EN_COURS_DE_LIVRAISON", "LIVRE", "DELIVERED"].includes(s.status)
        );

        transaction.update(doc(db, "orders", parentOrderId), {
          status: allReady ? "A_RAMASSER" : "EN_PREPARATION",
          updatedAt: serverTimestamp()
        });
      }
    });
  },

  // ============================================================================
  // 🚚 OUTILS LIVREUR
  // ============================================================================

  async validatePickup(subOrderId, carrierId) {
    const subRef = doc(db, "sub_orders", subOrderId);

    await runTransaction(db, async (transaction) => {
      const subSnap = await transaction.get(subRef);
      if (!subSnap.exists()) throw new Error("Sous-commande introuvable.");

      transaction.update(subRef, {
        status: "EN_COURS_DE_LIVRAISON",
        carrierId: carrierId,
        pickedUpAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const parentOrderId = subSnap.data().parentOrderId || subSnap.data().orderId;
      if (parentOrderId) {
        transaction.update(doc(db, "orders", parentOrderId), {
          status: "EN_COURS_DE_LIVRAISON",
          updatedAt: serverTimestamp()
        });
      }
    });
  },

  async validateFinalDelivery(orderId, tempHaccp, signatureBase64, recipientName = "") {
    if (!orderId) throw new Error("L'identifiant de la commande est requis.");
    if (tempHaccp === undefined || tempHaccp === null) throw new Error("Le relevé de température HACCP est obligatoire.");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error("Commande introuvable.");

    const orderData = orderSnap.data();
    const qSubs = query(collection(db, "sub_orders"), where("parentOrderId", "==", orderId));
    const subSnaps = await getDocs(qSubs);
    const subOrders = subSnaps.docs.map(d => ({ id: d.id, ...d.data() }));

    const isPublicSector = orderData.paymentMethod === "mandat_public" || orderData.buyerRole === "acheteur_public";

    await runTransaction(db, async (transaction) => {
      transaction.update(orderRef, {
        status: "LIVRE",
        deliveredAt: serverTimestamp(),
        tempHaccp: Number(tempHaccp),
        recipientName: recipientName || "-",
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        updatedAt: serverTimestamp()
      });

      subOrders.forEach((so) => {
        transaction.update(doc(db, "sub_orders", so.id), {
          status: "LIVRE",
          tempHaccp: Number(tempHaccp),
          recipientName: recipientName || "-",
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // BL (Bon de Livraison)
      const blDocId = `BL-${orderId.substring(0, 8).toUpperCase()}`;
      transaction.set(doc(db, "documents", blDocId), {
        id: blDocId,
        orderId: orderId,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        selectedDate: orderData.selectedDate || orderData.deliveryDate || "-",
        type: "Bon de livraison",
        entity: "Plateforme Âne & Gorille",
        totalAmount: orderData.totalAmount || orderData.amountTTC || orderData.totalTTC || 0,
        tempHaccp: Number(tempHaccp),
        recipientName: recipientName || "-",
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        createdAt: serverTimestamp()
      }, { merge: true });

      // Factures Vente & Commission
      subOrders.forEach((so) => {
        const vteDocId = `FAC-VTE-${so.id.substring(0, 8).toUpperCase()}`;
        const subAmountHT = Number(so.amountHT || (so.amount ? so.amount / 1.055 : 0));
        const subAmountTTC = Number(so.amountTTC || so.amount || 0);

        transaction.set(doc(db, "documents", vteDocId), {
          id: vteDocId,
          orderId: orderId,
          subOrderId: so.id,
          type: "Facture de vente",
          legalMention: `Facture émise par Âne & Gorille au nom et pour le compte de ${so.producerName || "Producteur"}`,
          producerId: so.producerId,
          producerName: so.producerName,
          buyerId: orderData.buyerId,
          buyerName: orderData.buyerName,
          amountHT: Number(subAmountHT.toFixed(2)),
          amountTTC: Number(subAmountTTC.toFixed(2)),
          vatRate: 5.5,
          status: isPublicSector ? "pending_30d" : "paid",
          createdAt: serverTimestamp()
        });

        const comDocId = `FAC-COM-${so.id.substring(0, 8).toUpperCase()}`;
        const commissionHT = subAmountHT * 0.12;
        const commissionTVA = commissionHT * 0.20;
        const commissionTTC = commissionHT + commissionTVA;

        transaction.set(doc(db, "documents", comDocId), {
          id: comDocId,
          orderId: orderId,
          subOrderId: so.id,
          type: "Frais de service (commission)",
          legalMention: "TVA 20% - Régime Réel Simplifié de TVA",
          producerId: so.producerId,
          producerName: so.producerName,
          amountHT: Number(commissionHT.toFixed(2)),
          amountVAT: Number(commissionTVA.toFixed(2)),
          amountTTC: Number(commissionTTC.toFixed(2)),
          vatRate: 20,
          status: "paid",
          createdAt: serverTimestamp()
        });
      });

      // File d'attente B2G (Chorus Pro)
      if (isPublicSector) {
        transaction.set(doc(collection(db, "chorus_queue")), {
          orderId: orderId,
          buyerSiret: orderData.siretBuyer || "-",
          refEngagement: orderData.refEngagement || "-",
          totalAmount: orderData.totalAmount || orderData.amountTTC || orderData.totalTTC || 0,
          status: "pending_transmission",
          createdAt: serverTimestamp()
        });
      }
    });

    return { success: true };
  }
};
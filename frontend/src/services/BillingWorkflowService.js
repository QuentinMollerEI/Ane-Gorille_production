/**
 * 🧾 SERVICE DE FACTURATION LÉGALE & CHORUS PRO : BillingWorkflowService.js
 * Exécuté automatiquement lors de la livraison physique (statut LIVRE).
 * Respecte le Mandat de Facturation (Art. 289-I-2 CGI) & la Franchise de TVA (Art. 293 B CGI).
 */
import { db } from "../config/firebase";
import { collection, doc, writeBatch, getDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export const BillingWorkflowService = {
  async generatePostDeliveryDocuments(orderId, tempHaccp, signatureBase64, recipientName) {
    if (!orderId) throw new Error("Identifiant de commande manquant pour la facturation.");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error(`Commande parent introuvable : ${orderId}`);
    }

    const orderData = orderSnap.data();
    const subOrdersSnap = await getDocs(
      query(collection(db, "sub_orders"), where("parentOrderId", "==", orderId))
    );

    const batch = writeBatch(db);

    // 1. BON DE LIVRAISON ÉMARGÉ (BL)
    const blDocId = `BL-${orderId.substring(0, 8).toUpperCase()}`;
    batch.set(doc(db, "documents", blDocId), {
      id: blDocId,
      orderId,
      type: "Bon de livraison",
      entity: "Âne & Gorille (Quentin Moller EI)",
      buyerId: orderData.buyerId,
      buyerName: orderData.buyerName,
      deliveryDate: orderData.deliveryDate,
      tempHaccp: Number(tempHaccp || 0),
      signature: signatureBase64 || "EMARGEMENT_POD_OK",
      recipientName: recipientName || "Réceptionnaire",
      totalTTC: orderData.grandTotalTTC,
      createdAt: serverTimestamp(),
    });

    // 2. GENERATION DES FACTURES SOUS MANDAT (FAC-VTE) ET COMMISSIONS (FAC-COM)
    subOrdersSnap.docs.forEach((subDoc) => {
      const subData = subDoc.data();
      const subAmountHT = Number(subData.amountHT || 0);

      // Facture de vente (Vendeur -> Acheteur) émise sous mandat (Art. 289-I-2 CGI)
      const vteDocId = `FAC-VTE-${subDoc.id.substring(0, 8).toUpperCase()}`;
      batch.set(doc(db, "documents", vteDocId), {
        id: vteDocId,
        orderId,
        subOrderId: subDoc.id,
        type: "Facture de vente",
        legalMention: `Facture émise par Âne & Gorille au nom et pour le compte de ${subData.producerName}`,
        producerId: subData.producerId,
        producerName: subData.producerName,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        amountHT: subAmountHT,
        vatRate: 5.5,
        status: orderData.paymentMethod === "mandat_public" ? "pending_30d" : "paid",
        createdAt: serverTimestamp(),
      });

      // Facture de commission (Plateforme -> Vendeur) avec Franchise de TVA (Art. 293 B CGI)
      const comDocId = `FAC-COM-${subDoc.id.substring(0, 8).toUpperCase()}`;
      const commissionHT = subAmountHT * 0.12;

      batch.set(doc(db, "documents", comDocId), {
        id: comDocId,
        orderId,
        subOrderId: subDoc.id,
        type: "Frais de service",
        legalMention: "TVA non applicable, art. 293 B du CGI",
        producerId: subData.producerId,
        producerName: subData.producerName,
        amountHT: Number(commissionHT.toFixed(2)),
        vatRate: 0,
        status: "paid",
        createdAt: serverTimestamp(),
      });
    });

    // 3. TELETRANSMISSION CHORUS PRO (B2G)
    if (orderData.paymentMethod === "mandat_public") {
      const chorusRef = doc(collection(db, "chorus_queue"));
      batch.set(chorusRef, {
        orderId,
        buyerSiret: orderData.siretBuyer || "-",
        refEngagement: orderData.refEngagement || "-",
        totalAmountTTC: orderData.grandTotalTTC,
        status: "pending_transmission",
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  },
};

export default BillingWorkflowService;
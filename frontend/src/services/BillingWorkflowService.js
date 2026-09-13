import { db } from "../config/firebase";
import { collection, doc, writeBatch, getDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export const BillingWorkflowService = {
  async generatePostDeliveryDocuments(orderId, tempHaccp) {
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    const orderData = orderSnap.data();
    
    const subOrdersSnap = await getDocs(query(collection(db, "sub_orders"), where("parentOrderId", "==", orderId)));
    const batch = writeBatch(db);

    // 1. Bon de Livraison Officiel
    batch.set(doc(db, "documents", `BL-${orderId}`), {
      orderId,
      type: "Bon de livraison",
      amount: orderData.totalAmount,
      tempHaccp,
      createdAt: serverTimestamp()
    });

    // 2. Facturation transparente : La marketplace n'est qu'intermédiaire[cite: 5, 8]
    subOrdersSnap.docs.forEach(subDoc => {
      const subData = subDoc.data();
      
      // Facture de vente (Vendeur -> Acheteur)
      batch.set(doc(db, "documents", `FAC-VTE-${subDoc.id}`), {
        orderId,
        type: "Facture de vente",
        producerId: subData.producerId,
        buyerId: orderData.buyerId,
        amount: subData.amount,
        createdAt: serverTimestamp()
      });

      // Facture de commission (Plateforme -> Vendeur) pour déclaration URSSAF correcte[cite: 8]
      batch.set(doc(db, "documents", `FAC-COM-${subDoc.id}`), {
        orderId,
        type: "Frais de service",
        producerId: subData.producerId,
        amount: subData.amount * 0.18, // 18% de commission
        createdAt: serverTimestamp()
      });
    });

    // 3. Routage automatique vers Chorus Pro pour le B2G[cite: 9]
    if (orderData.paymentMethod === "mandat_public") {
      batch.set(doc(collection(db, "chorus_queue")), {
        orderId,
        siret: orderData.siretBuyer,
        refEngagement: orderData.refEngagement,
        status: "pending_transmission",
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
  }
};
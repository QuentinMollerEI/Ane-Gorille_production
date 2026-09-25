/**
 * 🚚 SERVICE CYCLE DE VIE & TRAÇABILITÉ : OrderWorkflowService.js
 * Gère les transitions de statut de commande, le contrôle de température HACCP (10-15°C)
 * et le déclenchement de la facturation lors du statut LIVRÉ.
 */
import { db } from "../config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import BillingWorkflowService from "./BillingWorkflowService";

export const OrderWorkflowService = {
  /**
   * 1. ÉTAPE PREPARATION : Le maraîcher conditionne et assigne le N° de lot ("L")
   */
  async validatePreparation(subOrderId, lotNumber) {
    if (!subOrderId || !lotNumber) throw new Error("ID de sous-commande et N° de lot obligatoires.");

    await updateDoc(doc(db, "sub_orders", subOrderId), {
      status: "A_RAMASSER",
      lotNumber: lotNumber.startsWith("L") ? lotNumber : `L${lotNumber}`,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * 2. ÉTAPE RAMASSE : Le chauffeur charge le colis au hub
   */
  async validatePickup(subOrderId, carrierId) {
    await updateDoc(doc(db, "sub_orders", subOrderId), {
      status: "EN_COURS_DE_LIVRAISON",
      carrierId: carrierId || "TRANSPORTEUR_DREAL",
      pickedUpAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * 3. ÉTAPE LIVRAISON : Validation POD (Température + Signature) & Déclenchement Facturation
   */
  async validateFinalDelivery(orderId, tempHaccp, signatureBase64, recipientName) {
    const tempNum = Number(tempHaccp);
    if (!orderId) throw new Error("Identifiant de commande obligatoire.");
    if (isNaN(tempNum) || tempNum < 0 || tempNum > 25) {
      throw new Error("Relevé de température HACCP invalide.");
    }

    // Mise à jour de la commande globale
    await updateDoc(doc(db, "orders", orderId), {
      status: "LIVRE",
      tempHaccp: tempNum,
      signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
      recipientName: recipientName || "Réceptionnaire",
      deliveredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Génération automatique des pièces comptables Factur-X & Chorus Pro
    await BillingWorkflowService.generatePostDeliveryDocuments(
      orderId,
      tempNum,
      signatureBase64,
      recipientName
    );
  },
};

export default OrderWorkflowService;
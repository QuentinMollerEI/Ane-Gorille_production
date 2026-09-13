import { db } from "../config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { BillingWorkflowService } from "./BillingWorkflowService";

export const DeliveryWorkflowService = {
  async validatePreparation(subOrderId, lotNumber) {
    await updateDoc(doc(db, "sub_orders", subOrderId), {
      status: "A_RAMASSER",
      lotNumber: lotNumber,
      updatedAt: serverTimestamp()
    });
  },

  async validatePickup(subOrderId, carrierId) {
    await updateDoc(doc(db, "sub_orders", subOrderId), {
      status: "EXPEDIE",
      carrierId: carrierId,
      pickedUpAt: serverTimestamp()
    });
  },

  async validateFinalDelivery(orderId, tempHaccp, signatureBase64) {
    await updateDoc(doc(db, "orders", orderId), {
      status: "LIVRE",
      tempHaccp,
      signature: signatureBase64,
      deliveredAt: serverTimestamp()
    });

    // Délégation au service de facturation une fois la livraison physique validée
    await BillingWorkflowService.generatePostDeliveryDocuments(orderId, tempHaccp);
  }
};
import { PdfTemplateEngine } from "./PdfTemplateEngine.js";

/**
 * 📋 GÉNÉRATEUR DE BONS DE COMMANDE B2B / CHORUS PRO
 */
export const OrderSlipGenerator = {
  generateOrderSlip(orderData) {
    const doc = PdfTemplateEngine.createDocument({
      docType: "BON DE COMMANDE",
      docNumber: orderData.orderId,
      docDate: new Date().toLocaleDateString("fr-FR"),
      buyer: {
        companyName: orderData.buyerCompany || orderData.buyerName,
        siret: orderData.buyerSiret
      },
      vendor: {
        companyName: "Âne & Gorille (Marketplace)"
      },
      items: orderData.items || [],
      totals: orderData.totals || {},
      refEngagement: orderData.refEngagement
    });

    doc.save(`BC_${orderData.orderId || "commande"}.pdf`);
  }
};

export default OrderSlipGenerator;
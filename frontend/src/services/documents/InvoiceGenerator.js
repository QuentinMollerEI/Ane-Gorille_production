import { PdfTemplateEngine } from "./PdfTemplateEngine.js";

/**
 * 🧾 GÉNÉRATEUR DE FACTURES B2B / B2G
 */
export const InvoiceGenerator = {
  generateInvoice(orderData) {
    const doc = PdfTemplateEngine.createDocument({
      docType: "FACTURE OFFICIELLE",
      docNumber: orderData.orderId || "FACT-2026-001",
      docDate: new Date(orderData.createdAt?.toDate?.() || Date.now()).toLocaleDateString("fr-FR"),
      buyer: {
        companyName: orderData.buyerCompany || orderData.buyerName,
        siret: orderData.buyerSiret,
        address: orderData.buyerAddress
      },
      vendor: {
        companyName: orderData.producerName || "Plateforme Âne & Gorille",
        siret: orderData.producerSiret || "900 000 000 00000"
      },
      items: orderData.items || [],
      totals: orderData.totals || {},
      refEngagement: orderData.refEngagement
    });

    doc.save(`Facture_${orderData.orderId || "B2B"}.pdf`);
  }
};

export default InvoiceGenerator;
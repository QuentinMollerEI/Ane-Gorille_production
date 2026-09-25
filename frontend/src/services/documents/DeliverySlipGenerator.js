import { PdfTemplateEngine } from "./PdfTemplateEngine.js";

/**
 * 🚚 GÉNÉRATEUR DE BONS DE LIVRAISON (Quai & Emargement)
 */
export const DeliverySlipGenerator = {
  generateDeliverySlip(deliveryData) {
    const doc = PdfTemplateEngine.createDocument({
      docType: "BON DE LIVRAISON",
      docNumber: deliveryData.subOrderId || deliveryData.orderId,
      docDate: new Date().toLocaleDateString("fr-FR"),
      buyer: {
        companyName: deliveryData.buyerName,
        siret: deliveryData.buyerSiret
      },
      vendor: {
        companyName: deliveryData.producerName
      },
      items: deliveryData.items || [],
      totals: {
        itemsTotalHT: deliveryData.totalHT,
        itemsVAT: deliveryData.totalVAT,
        grandTotalTTC: (deliveryData.totalHT || 0) + (deliveryData.totalVAT || 0)
      }
    });

    // Zone d'émargement quai
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 235, 182, 35, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Émargement & Réception Quai :", 18, 242);
    doc.setFont("helvetica", "normal");
    doc.text("Date, Nom du Réceptionnaire & Signature avec Tampon :", 18, 248);

    doc.save(`BL_${deliveryData.subOrderId || "livraison"}.pdf`);
  }
};

export default DeliverySlipGenerator;
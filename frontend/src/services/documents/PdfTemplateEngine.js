import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * 📄 MOTEUR CENTRAL DE GÉNÉRATION DE DOCUMENTS PDF (Âne & Gorille)
 * Standardise l'en-tête, le pied de page LME, le récapitulatif de TVA et la mise en page.
 */
export const PdfTemplateEngine = {
  createDocument(options = {}) {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const {
      docType = "DOCUMENT",
      docNumber = "PO-2026-0001",
      docDate = new Date().toLocaleDateString("fr-FR"),
      buyer = {},
      vendor = {},
      items = [],
      totals = {},
      refEngagement = null
    } = options;

    // 1. En-tête officiel Âne & Gorille
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(6, 78, 59); // Emerald 900
    doc.text("ÂNE & GORILLE", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text("Marketplace Alimentaire & Artisanale B2B / B2G", 14, 25);
    doc.text("Quentin Moller EI - SIRET: 900 000 000 00000", 14, 29);

    // Bloc Titre du Document
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(120, 12, 76, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(String(docType), 124, 20);
    doc.setFontSize(9);
    doc.text(`N° ${docNumber}`, 124, 26);
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${docDate}`, 124, 30);

    // 2. Bloc Émetteur / Destinataire
    let currentY = 42;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, currentY, 86, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Vendeur / Producteur :", 18, currentY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(String(vendor.companyName || vendor.name || "Producteur Partenaire"), 18, currentY + 11);
    doc.text(`SIRET : ${vendor.siret || "-"}`, 18, currentY + 16);
    doc.text(String(vendor.address || "Adresse non renseignée"), 18, currentY + 21);

    doc.rect(110, currentY, 86, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Acheteur Client :", 114, currentY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(String(buyer.companyName || buyer.name || "Client B2B"), 114, currentY + 11);
    doc.text(`SIRET : ${buyer.siret || "-"}`, 114, currentY + 16);
    if (refEngagement) {
      doc.text(`Chorus Pro / Engagement : ${refEngagement}`, 114, currentY + 21);
    } else {
      doc.text(String(buyer.address || "Adresse non renseignée"), 114, currentY + 21);
    }

    // 3. Tableau des Articles (jspdf-autotable)
    currentY += 34;
    const tableBody = items.map((item) => [
      String(item.name || item.title || "Produit"),
      String(item.batchNumber || "L-2026-001"),
      `${Number(item.priceHT || 0).toFixed(2)} €`,
      `${item.vatRate || 5.5} %`,
      String(item.quantity || 1),
      `${((item.priceHT || 0) * (item.quantity || 1)).toFixed(2)} €`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [["Désignation", "N° Lot HACCP", "Prix Unit. HT", "TVA", "Qté", "Total HT"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 30 },
        2: { halign: "right" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "right" }
      }
    });

    // 4. Récapitulatif Financier & TVA
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 20) + 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(120, finalY, 76, 30, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text("Total Produits HT :", 124, finalY + 6);
    doc.text(`${(totals.itemsTotalHT || 0).toFixed(2)} €`, 188, finalY + 6, { align: "right" });

    doc.text("Frais de Port HT :", 124, finalY + 11);
    doc.text(`${(totals.shippingFeeHT || 0).toFixed(2)} €`, 188, finalY + 11, { align: "right" });

    doc.text("Total TVA :", 124, finalY + 16);
    doc.text(`${((totals.itemsVAT || 0) + (totals.shippingVAT || 0)).toFixed(2)} €`, 188, finalY + 16, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(6, 78, 59);
    doc.text("Total NET TTC :", 124, finalY + 24);
    doc.text(`${(totals.grandTotalTTC || 0).toFixed(2)} €`, 188, finalY + 24, { align: "right" });

    // 5. Pied de page LME & Mentions Légales
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Plateforme Âne & Gorille - Règlement selon conditions LME B2B (30 jours) ou Mandat Administratif Chorus Pro.",
      105,
      285,
      { align: "center" }
    );
    doc.text(
      "En cas de retard de paiement, pénalité de 3 fois le taux d'intérêt légal + indemnité forfaitaire de recouvrement de 40 €.",
      105,
      289,
      { align: "center" }
    );

    return doc;
  }
};

export default PdfTemplateEngine;
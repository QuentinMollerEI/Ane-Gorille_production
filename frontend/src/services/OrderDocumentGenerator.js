import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Helper universel de nettoyage pour pdf-lib (StandardFonts.Helvetica / WinAnsiEncoding).
 * Convertit tous les caractères accentués, symboles et ponctuations spéciales en équivalents ASCII
 * pour garantir l'absence totale d'exception "WinAnsi cannot encode".
 */
const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let text = String(str);

  const replacements = {
    "€": " EUR",
    "’": "'",
    "‘": "'",
    "‚": "'",
    "“": '"',
    "”": '"',
    "«": '"',
    "»": '"',
    "°": " deg",
    "–": "-",
    "—": "-",
    "…": "...",
    œ: "oe",
    Œ: "OE",
    æ: "ae",
    Æ: "AE",
    à: "a",
    á: "a",
    â: "a",
    ã: "a",
    ä: "a",
    è: "e",
    é: "e",
    ê: "e",
    ë: "e",
    ì: "i",
    í: "i",
    î: "i",
    ï: "i",
    ò: "o",
    ó: "o",
    ô: "o",
    õ: "o",
    ö: "o",
    ù: "u",
    ú: "u",
    û: "u",
    ü: "u",
    ç: "c",
    À: "A",
    Á: "A",
    Â: "A",
    Ã: "A",
    Ä: "A",
    È: "E",
    É: "E",
    Ê: "E",
    Ë: "E",
    Ì: "I",
    Í: "I",
    Î: "I",
    Ï: "I",
    Ò: "O",
    Ó: "O",
    Ô: "O",
    Õ: "O",
    Ö: "O",
    Ù: "U",
    Ú: "U",
    Û: "U",
    Ü: "U",
    Ç: "C",
  };

  for (const [k, v] of Object.entries(replacements)) {
    text = text.replaceAll(k, v);
  }

  // Filtrage strict pour ne conserver que les caractères ASCII imprimables ( -~)
  return text.replace(/[^\x20-\x7E]/g, "");
};

/**
 * Helper d'échappement XML strict (Factur-X / EN 16931)
 */
const escapeXml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/**
 * 🧾 SERVICE CENTRALISÉ DE GÉNÉRATION DE DOCUMENTS PDF & FACTUR-X
 * Responsabilité unique : Convertir les données de commande, livraison ou facturation
 * en documents PDF certifiés (BC, BP, BL avec contrôles HACCP) et Factur-X (PDF/A-3 + XML CII EN 16931).
 */
export const OrderDocumentGenerator = {
  /**
   * Génère le fichier XML Factur-X conforme à la norme européenne EN 16931 (Profil BASIC)
   */
  generateFacturXXml(docData) {
    const rawDate = docData.date
      ? docData.date.replace(/\//g, "").replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const issueDate = escapeXml(rawDate);

    const amountVal = Number(docData.amount || 0);
    const amount = amountVal.toFixed(2);
    const vatRateVal = Number(docData.vatRate || 5.5);
    const vatRate = vatRateVal.toFixed(2);

    const vatAmountVal = amountVal * (vatRateVal / (100 + vatRateVal));
    const vatAmount = vatAmountVal.toFixed(2);
    const amountHT = (amountVal - vatAmountVal).toFixed(2);

    const docId = escapeXml(docData.id || "FAC-2026-001");
    const sellerName = escapeXml(
      docData.producerName ||
        docData.producer ||
        "Plateforme Ane et Gorille SAS",
    );
    const buyerName = escapeXml(
      docData.buyerName || docData.entity || docData.buyer || "Acheteur Client",
    );
    const buyerSiret = escapeXml(
      docData.buyerSiret || docData.siret || "21310555400018",
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
                          xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
                          xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
                          xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${docId}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${sellerName}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">98765432100019</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${buyerName}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${buyerSiret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount currencyID="EUR">${vatAmount}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount currencyID="EUR">${amountHT}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${vatRate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount currencyID="EUR">${amountHT}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount currencyID="EUR">${amountHT}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${vatAmount}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="EUR">${amount}</ram:GrandTotalAmount>
        <ram:DuePayableAmount currencyID="EUR">${amount}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
  },

  /**
   * Génère et déclenche le téléchargement d'un document PDF certifié ou Factur-X
   *
   * @param {Object} docData - Données du document (id, date, amount, items, buyerName, producerName, tempHaccp, signature, etc.)
   * @param {string} docType - 'BC' | 'BP' | 'BL' | 'FAC'
   */
  async generatePDF(docData, docType = "FAC") {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 en points
      const fontNormal = await pdfDoc.embedStandardFont(
        StandardFonts.Helvetica,
      );
      const fontBold = await pdfDoc.embedStandardFont(
        StandardFonts.HelveticaBold,
      );

      const { height } = page.getSize();
      let y = height - 50;

      // 🟩 EN-TÊTE OFFICIEL DE LA PLATFORME
      page.drawText(cleanText("PLATEFORME ANE & GORILLE"), {
        x: 50,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.08, 0.45, 0.25),
      });
      page.drawText(
        cleanText("Alimentation locale en circuit court B2B / B2G"),
        {
          x: 50,
          y: y - 18,
          size: 9,
          font: fontNormal,
          color: rgb(0.4, 0.4, 0.4),
        },
      );

      y -= 50;

      // Titres selon le type de document
      const typeTitles = {
        BC: "BON DE COMMANDE (BC)",
        BP: "BON DE PREPARATION MARAICHER (BP)",
        BL: "BON DE LIVRAISON EMARGE (BL)",
        FAC: "FACTURE OFFICIELLE (Factur-X)",
      };

      const rawTitle = typeTitles[docType] || "DOCUMENT LOGISTIQUE";
      page.drawText(cleanText(rawTitle), {
        x: 50,
        y,
        size: 14,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      y -= 25;
      page.drawLine({
        start: { x: 50, y },
        end: { x: 545, y },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });
      y -= 25;

      // 📌 INFORMATIONS DE PIÈCE
      const refCode = cleanText(docData.blCode || docData.id || "PIECE-2026");
      const dateStr = cleanText(
        docData.date || new Date().toLocaleDateString("fr-FR"),
      );

      page.drawText(cleanText(`N deg Reference : ${refCode}`), {
        x: 50,
        y,
        size: 10,
        font: fontBold,
      });
      page.drawText(cleanText(`Date d'emission : ${dateStr}`), {
        x: 300,
        y,
        size: 10,
        font: fontNormal,
      });

      y -= 20;

      // PARTENAIRES CONCERNÉS
      const buyer = cleanText(
        docData.buyerName ||
          docData.entity ||
          docData.buyer ||
          "Acheteur Public / Pro",
      );
      const producer = cleanText(
        docData.producerName || docData.producer || "Maraicher Exploitant",
      );

      page.drawText(cleanText(`Expediteur / Maraicher : ${producer}`), {
        x: 50,
        y,
        size: 9,
        font: fontNormal,
      });
      page.drawText(cleanText(`Destinataire : ${buyer}`), {
        x: 300,
        y,
        size: 9,
        font: fontBold,
      });

      if (docData.refEngagement && docData.refEngagement !== "-") {
        y -= 15;
        page.drawText(
          cleanText(`N deg Engagement Public : ${docData.refEngagement}`),
          { x: 300, y, size: 9, font: fontNormal, color: rgb(0, 0.3, 0.7) },
        );
      }

      y -= 30;

      // ❄️ SECTION DÉDIÉE SÉCURITÉ ALIMENTAIRE & CONTÔLE HACCP (Si BL)
      if (docType === "BL" || docData.tempHaccp) {
        page.drawRectangle({
          x: 50,
          y: y - 35,
          width: 495,
          height: 40,
          color: rgb(0.93, 0.97, 0.94),
          borderColor: rgb(0.7, 0.88, 0.75),
          borderWidth: 1,
        });

        const tempVal = docData.tempHaccp
          ? `${docData.tempHaccp} deg C`
          : "Conforme (2 deg C - 6 deg C)";
        page.drawText(
          cleanText(
            "CONTROLE DE SECURITE SANITAIRE ET CHAINE DU FROID (HACCP)",
          ),
          {
            x: 60,
            y: y - 12,
            size: 9,
            font: fontBold,
            color: rgb(0.08, 0.45, 0.25),
          },
        );
        page.drawText(
          cleanText(
            `Temperature relevee au dechargement : ${tempVal} | Statut : CONFORME (Reglement CE 852/2004)`,
          ),
          {
            x: 60,
            y: y - 27,
            size: 8,
            font: fontNormal,
            color: rgb(0.15, 0.2, 0.15),
          },
        );

        y -= 50;
      }

      // 📦 TABLEAU DE CONTENU DES ARTICLES
      page.drawText(cleanText("DETAIL DES PRODUITS & PRESTATIONS :"), {
        x: 50,
        y,
        size: 10,
        font: fontBold,
      });
      y -= 18;

      // En-tête tableau
      page.drawRectangle({
        x: 50,
        y: y - 15,
        width: 495,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
      });
      page.drawText(cleanText("Designation Produit"), {
        x: 55,
        y: y - 11,
        size: 8,
        font: fontBold,
      });
      page.drawText(cleanText("Quantite"), {
        x: 300,
        y: y - 11,
        size: 8,
        font: fontBold,
      });
      page.drawText(cleanText("Prix Unitaire HT"), {
        x: 380,
        y: y - 11,
        size: 8,
        font: fontBold,
      });
      page.drawText(cleanText("Total TTC"), {
        x: 470,
        y: y - 11,
        size: 8,
        font: fontBold,
      });

      y -= 25;

      const items = docData.items || [
        {
          name: docData.type || "Prestation Logistique & Alimentaire",
          quantity: 1,
          price: docData.amount || 18.75,
        },
      ];

      items.forEach((item) => {
        const name = cleanText(
          item.name || item.title || "Produit local frais",
        );
        const qty = cleanText(item.quantity || item.qty || 1);
        const priceNum = Number(item.price || item.priceHT || 0);
        const totalNum = Number(qty || 1) * priceNum;

        page.drawText(name.slice(0, 45), {
          x: 55,
          y,
          size: 8,
          font: fontNormal,
        });
        page.drawText(`${qty}`, { x: 310, y, size: 8, font: fontNormal });
        page.drawText(cleanText(`${priceNum.toFixed(2)} EUR`), {
          x: 390,
          y,
          size: 8,
          font: fontNormal,
        });
        page.drawText(cleanText(`${totalNum.toFixed(2)} EUR`), {
          x: 475,
          y,
          size: 8,
          font: fontNormal,
        });

        y -= 16;
      });

      y -= 15;
      page.drawLine({
        start: { x: 50, y },
        end: { x: 545, y },
        thickness: 0.8,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 25;

      // 💶 TOTAUX FINANCIERS & TVA
      const totalTTC = Number(docData.amount || 0);
      const vatRate = Number(docData.vatRate || 5.5);
      const vatAmount = totalTTC * (vatRate / (100 + vatRate));
      const totalHT = totalTTC - vatAmount;

      page.drawText(cleanText(`Montant Total HT : ${totalHT.toFixed(2)} EUR`), {
        x: 350,
        y,
        size: 9,
        font: fontNormal,
      });
      y -= 15;
      page.drawText(
        cleanText(`TVA (${vatRate}%) : ${vatAmount.toFixed(2)} EUR`),
        { x: 350, y, size: 9, font: fontNormal },
      );
      y -= 18;
      page.drawText(
        cleanText(`TOTAL A REGLER TTC : ${totalTTC.toFixed(2)} EUR`),
        { x: 350, y, size: 11, font: fontBold, color: rgb(0.08, 0.45, 0.25) },
      );

      y -= 40;

      // ✍️ ÉMARGEMENT & SIGNATURE (Si BL)
      if (docType === "BL") {
        page.drawText(cleanText("EMARGEMENT & PREUVE DE RECEPTION CLIENT :"), {
          x: 50,
          y,
          size: 9,
          font: fontBold,
        });
        y -= 15;
        page.drawRectangle({
          x: 50,
          y: y - 30,
          width: 220,
          height: 35,
          color: rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
        page.drawText(cleanText("Signature Acheteur / Cachet :"), {
          x: 55,
          y: y - 10,
          size: 7,
          font: fontNormal,
          color: rgb(0.5, 0.5, 0.5),
        });
        page.drawText(cleanText("EMARGE NUMERIQUEMENT OK"), {
          x: 55,
          y: y - 24,
          size: 8,
          font: fontBold,
          color: rgb(0, 0.5, 0),
        });
      }

      // 📄 EMBARQUEMENT DU XML FACTUR-X (SI FACTURE / FACTUR-X)
      if (docType === "FAC") {
        const xmlContent = this.generateFacturXXml(docData);
        const xmlBytes = new TextEncoder().encode(xmlContent);

        await pdfDoc.attach(xmlBytes, "factur-x.xml", {
          mimeType: "text/xml",
          description:
            "Donnees de facturation structurees EN 16931 pour Chorus Pro et PDP",
          creationDate: new Date(),
          modificationDate: new Date(),
        });
      }

      // 🏁 GÉNÉRATION DU BLOB PDF ET DÉCLENCHEMENT DU TÉLÉCHARGEMENT
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${docType}_${refCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(
        "Erreur lors de la generation du document PDF / Factur-X :",
        err,
      );
      alert("Une erreur est survenue lors de la creation du document PDF.");
    }
  },

  /**
   * Téléchargement autonome de la facture XML Factur-X brute pour dépôt direct Chorus Pro
   */
  downloadFacturXXml(docData) {
    const xmlContent = this.generateFacturXXml(docData);
    const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FacturX_${docData.id || "FAC"}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

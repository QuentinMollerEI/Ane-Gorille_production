const PDFDocument = require("pdfkit");

/**
 * 1. Génère le PDF du Bon de Commande (BC) pour l'Acheteur
 */
function generateOrderPdf(orderData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // En-tête de marque
    doc
      .fontSize(20)
      .fillColor("#047857")
      .text("ÂNE & GORILLE", { align: "left" })
      .fontSize(10)
      .fillColor("#64748b")
      .text("Alimentation locale & Circuit court B2B/B2G")
      .moveDown();

    // Titre Document
    doc
      .fontSize(16)
      .fillColor("#1e293b")
      .text(`BON DE COMMANDE (BC) #${orderData.id || "N/A"}`, { underline: true })
      .moveDown();

    // Métadonnées Acheteur & Facturation
    doc
      .fontSize(10)
      .fillColor("#334155")
      .text(`Acheteur : ${orderData.buyerName || "Acheteur Client"}`)
      .text(`Profil / Rôle : ${orderData.buyerRole || "acheteur_prive"}`)
      .text(`SIRET Acheteur : ${orderData.siretBuyer || "-"}`)
      .text(`Réf. Engagement (Chorus Pro) : ${orderData.refEngagement || "-"}`)
      .text(`Mode de paiement : ${orderData.paymentMethod === "mandat_public" ? "Mandat Administratif (Chorus Pro)" : "Paiement B2B Stripe"}`)
      .text(`Adresse de livraison : ${orderData.deliveryAddress || "Non renseignée"}`)
      .moveDown();

    // Séparateur
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cbd5e1").stroke().moveDown();

    // Liste des Produits
    doc.fontSize(12).fillColor("#047857").text("Détail de la commande :").moveDown(0.5);

    const items = orderData.items || [];
    items.forEach((item) => {
      const lineTotal = ((item.price || 0) * (item.quantity || 1)).toFixed(2);
      doc
        .fontSize(10)
        .fillColor("#1e293b")
        .text(`• ${item.name || "Produit"} (${item.producerName || "Producteur"})`)
        .text(`   Quantité : ${item.quantity || 1}  |  Prix unitaire HT : ${(item.price || 0).toFixed(2)} €  |  Total HT : ${lineTotal} €`)
        .moveDown(0.5);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cbd5e1").stroke().moveDown();

    // Total Global
    const total = Number(orderData.totalAmount || 0).toFixed(2);
    doc
      .fontSize(14)
      .fillColor("#047857")
      .text(`TOTAL COMMANDE HT : ${total} €`, { align: "right" });

    doc.end();
  });
}

/**
 * 2. Génère le PDF du Bon de Préparation (BP) pour le Maraîcher / Producteur
 */
function generateSubOrderPdf(subOrderData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // En-tête
    doc
      .fontSize(20)
      .fillColor("#047857")
      .text("ÂNE & GORILLE", { align: "left" })
      .fontSize(10)
      .fillColor("#64748b")
      .text("Espace Producteur — Alerte Récolte")
      .moveDown();

    // Titre Document
    doc
      .fontSize(16)
      .fillColor("#1e293b")
      .text(`BON DE PRÉPARATION (BP) #${subOrderData.id || "N/A"}`, { underline: true })
      .moveDown();

    // Infos Maraîcher & Commande
    doc
      .fontSize(10)
      .fillColor("#334155")
      .text(`Producteur / Exploitation : ${subOrderData.producerName || "Maraîcher"}`)
      .text(`Commande Parente : #${subOrderData.parentOrderId || "-"}`)
      .text(`Acheteur Destinataire : ${subOrderData.buyerName || "Client"}`)
      .moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cbd5e1").stroke().moveDown();

    // Liste des produits à récolter
    doc.fontSize(12).fillColor("#047857").text("Produits à récolter & préparer :").moveDown(0.5);

    const items = subOrderData.items || [];
    items.forEach((item) => {
      doc
        .fontSize(11)
        .fillColor("#1e293b")
        .text(`[  ]  ${item.name || item.title || "Produit"} — Quantité : ${item.quantity || 1}`)
        .moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(9).fillColor("#94a3b8").text("Merci de préparer ces produits pour le passage de la tournée logistique mutualisée Âne & Gorille.");

    doc.end();
  });
}

module.exports = {
  generateOrderPdf,
  generateSubOrderPdf,
};
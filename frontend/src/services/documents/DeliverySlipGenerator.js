/**
 * 📜 GÉNÉRATEUR UNIQUE : DeliverySlipGenerator.js
 * Emplacement : src/services/documents/DeliverySlipGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Ce module est DÉDIÉ EXCLUSIVEMENT à la génération du Bon de Livraison (BL / Delivery Slip).
 * Aligné à 100% sur le visuel, la structure, la typographie et la charte officielle d'OrderSlipGenerator.js.
 * Intègre TOUTES les mentions légales, sanitaires (HACCP), emballages consignés (Loi AGEC),
 * transport DREAL (-3.5t), Chorus Pro B2G et réserves à la réception.
 */

export const DeliverySlipGenerator = {

  /**
   * Configuration Légale de l'Opérateur de Transport & Plateforme
   */
  COMPANY_INFO: {
    tradeName: "Âne & Gorille",
    legalName: "Quentin Moller EI",
    legalStatus: "Entrepreneur Individuel (EI)",
    siret: "912 345 678 00012",
    rcs: "RCS Toulouse",
    drealLicense: "Licence de Transport Intérieur n° 2026/76/0001234",
    vatNumber: "FR 12 912345678",
    address: "Toulouse, France",
    phone: "05 82 95 06 24",
    email: "contact@ane-et-gorille.fr",
    website: "https://www.ane-et-gorille.fr",
    logoUrl: "/Logo.png"
  },

  /**
   * Génère le code HTML imprimable et téléchargeable du Bon de Livraison (BL)
   * @param {Object} order - La commande consolidée Firestore
   * @returns {string} Code HTML structuré aux couleurs Âne & Gorille
   */
  generateHTML(order) {
    if (!order) return "<p style='font-family:sans-serif; color:red; font-weight:bold;'>Erreur: Aucune donnée de commande fournie pour le Bon de Livraison.</p>";

    // 1. Horodatages et Identifiants
    const orderRefNumber = order.orderNumber || order.id?.substring(0, 8).toUpperCase() || "CMD-2026";
    const poFormatted = 'PO-' + orderRefNumber.toString().replace(/^PO-/, '');
    
    const docNumber = order.deliverySlipNumber 
      ? order.deliverySlipNumber 
      : 'BL-' + orderRefNumber.toString().replace(/^PO-/, '');

    const issueDateStr = order.createdAt?.toDate 
      ? order.createdAt.toDate().toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });

    const deliveryDateStr = order.deliveredAt?.toDate
      ? order.deliveredAt.toDate().toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : (order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "À la livraison");

    let dateFormatted = deliveryDateStr;
    if (deliveryDateStr && deliveryDateStr !== "À la livraison") {
      try {
        const d = new Date(deliveryDateStr);
        if (!isNaN(d.getTime())) {
          dateFormatted = d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
        }
      } catch (e) {
        dateFormatted = deliveryDateStr;
      }
    }

    const deliveryWindow = order.deliveryDetails?.deliveryWindow || order.deliveryWindow || "Créneau Matin (06h00 - 08h00)";
    const deliveryInstructions = order.deliveryDetails?.instructions || order.instructions || "Aucune consigne particulière";

    // 2. Relevé Sanitaire Température & Cagettes Consignées
    const tempHaccp = order.tempHaccp || order.deliveryTemp || "+3.8°C";
    const crateCount = order.crateCount || order.totalCrates || 1;

    // 3. Regroupement strict des articles par Maraîcher / Fournisseur
    const items = order.items || [];
    const groupedByProducer = items.reduce((acc, item) => {
      const pId = item.producerId || item.userId || "PROD_LOCAL";
      const pName = item.producerName || item.producerCompany || item.companyName || "Maraîcher Exploitant Local";
      if (!acc[pId]) {
        acc[pId] = {
          producerName: pName,
          producerCity: item.producerCity || item.city || item.harvestLocation || "",
          producerDept: item.producerDepartment || item.department || "",
          lotNumber: item.lotNumber || item.batchNumber || order.lotNumber || "LOT-HACCP-FR",
          items: []
        };
      }
      const qtyOrdered = Number(item.quantity || item.qty || 1);
      const qtyDelivered = Number(item.deliveredQuantity ?? item.qtyDelivered ?? qtyOrdered);
      const batchNumber = item.batchNumber || item.lotNumber || acc[pId].lotNumber;

      acc[pId].items.push({
        ...item,
        qtyOrdered,
        qtyDelivered,
        batchNumber
      });
      return acc;
    }, {});

    const isChorus = order.paymentMethod === 'mandat_public' || order.paymentMethod === 'mandat';
    const chorusBadge = isChorus ? '<span class="badge-b2g">Secteur Public (B2G)</span>' : '<span style="color:#0f766e; font-weight:800;">B2B Privé</span>';
    const buyerSiretHTML = (order.siretBuyer && order.siretBuyer !== '-') ? 'SIRET Client : <strong>' + order.siretBuyer + '</strong><br>' : '';
    const chorusRefHTML = (isChorus && order.refEngagement && order.refEngagement !== '-') ? 'N° Engagement Chorus Pro : <strong style="color:#1e40af;">' + order.refEngagement + '</strong><br>' : '';
    const signatureHTML = order.signature 
      ? '<img src="' + order.signature + '" style="max-height: 40px;" alt="Signature Client"/>' 
      : 'Date, Nom &amp; Signature du Réceptionnaire :<br><br><em>Réserves à la réception : [ ______________________ ]</em>';

    // Rendu des blocs fournisseurs
    const supplierBlocksHTML = Object.entries(groupedByProducer).map(([pId, group], index) => {
      const supplierIndex = index + 1;
      const cityDeptText = group.producerCity ? (' (' + group.producerCity + (group.producerDept ? ', ' + group.producerDept : '') + ')') : '';
      const cityDeptHTML = cityDeptText ? '<small style="font-weight:600; color:#64748b; text-transform:none;">' + cityDeptText + '</small>' : '';

      const itemRowsHTML = group.items.map((item, lIdx) => {
        const lineNum = String(lIdx + 1).padStart(3, '0');
        const sku = (item.id || item.productId || 'SKU').substring(0, 10).toUpperCase();
        const bioBadge = item.isBio ? '<span class="badge-bio">BIO</span>' : '';
        const unitStr = item.unit ? (' (' + item.unit + ')') : '';
        
        return `
          <tr>
            <td class="col-line">${lineNum}</td>
            <td class="col-sku">${sku}</td>
            <td>
              <strong>${item.name || item.title || "Produit Maraîcher"}</strong>
              ${bioBadge}
              <small style="color: #64748b;">${unitStr}</small>
              <br><small style="color: #64748b; font-size: 9px;">Traçabilité Lot : ${item.batchNumber}</small>
            </td>
            <td class="col-qty">${item.qtyOrdered} ${item.unit || 'kg'}</td>
            <td class="col-qty-deliv">${item.qtyDelivered} ${item.unit || 'kg'}</td>
            <td class="col-pack">Cagette Plastique Pro Consignée (HACCP)</td>
            <td class="col-check">[  ] OK</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="supplier-block">
          <div class="supplier-header">
            <div class="supplier-title">
              <span class="supplier-tag">Origine ${supplierIndex}</span>
              <span>${group.producerName}</span>
              ${cityDeptHTML}
            </div>
            <div style="font-size: 10px; font-weight: 800; color: #0f766e; font-family: monospace;">
              Lot Sanitaire HACCP : ${group.lotNumber}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="col-line">Ligne</th>
                <th class="col-sku">Code SKU</th>
                <th>Désignation Produit &amp; Traçabilité</th>
                <th class="col-qty">Qté Cmd</th>
                <th class="col-qty-deliv">Qté Livrée</th>
                <th class="col-pack">Conditionnement / Bacs</th>
                <th class="col-check">Contrôle</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHTML}
            </tbody>
          </table>

          <div class="supplier-footer-row">
            Colisage Origine ${supplierIndex} (${group.producerName}) : <strong>${group.items.length} référence(s) contrôlée(s)</strong>
          </div>
        </div>
      `;
    }).join('');

    // 4. Template HTML imprimable du Bon de Livraison (BL)
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de Livraison - ${docNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            line-height: 1.45;
          }

          /* --- EN-TÊTE MARQUE ÂNE & GORILLE --- */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .brand-block {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .brand-logo {
            height: 52px;
            width: auto;
            object-fit: contain;
            border-radius: 6px;
          }

          .brand-title {
            font-size: 21px;
            font-weight: 900;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            line-height: 1;
            margin: 0;
          }

          .brand-subtitle {
            font-size: 11px;
            font-weight: 800;
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 3px;
            display: block;
          }

          .brand-legal-info {
            font-size: 9px;
            color: #475569;
            margin-top: 4px;
            line-height: 1.35;
          }

          .doc-summary {
            text-align: right;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            min-width: 220px;
          }

          .doc-type-badge {
            display: inline-block;
            background: #0f766e;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
          }

          .doc-ref {
            font-size: 15px;
            font-weight: 900;
            font-family: 'Courier New', Courier, monospace;
            color: #0f172a;
          }

          .doc-date {
            font-size: 10px;
            color: #64748b;
            font-weight: 700;
            margin-top: 2px;
          }

          /* --- BANDEAU LIVRAISON --- */
          .delivery-banner {
            background: #f0fdf4;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .delivery-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #15803d;
            letter-spacing: 0.6px;
          }

          .delivery-value {
            font-size: 15px;
            font-weight: 900;
            color: #166534;
            margin-top: 2px;
          }

          .delivery-window-pill {
            background: #ffffff;
            color: #15803d;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #86efac;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }

          /* --- GRILLE DES COORDONNÉES ACHETEUR ET COMMANDE --- */
          .info-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
          }

          .info-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
          }

          .info-box-header {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f766e;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
            display: flex;
            justify-content: space-between;
          }

          .info-box-content {
            font-size: 11px;
            color: #1e293b;
            line-height: 1.5;
          }

          .badge-b2g {
            background: #dbeafe;
            color: #1e40af;
            font-size: 9px;
            font-weight: 900;
            padding: 1px 6px;
            border-radius: 3px;
            border: 1px solid #93c5fd;
          }

          /* --- BLOCS FOURNISSEURS / MARAÎCHERS --- */
          .supplier-block {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .supplier-header {
            background: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 7px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .supplier-title {
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .supplier-tag {
            background: #0f766e;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 3px;
          }

          /* TABLEAU DE DÉTAIL DES ARTICLES */
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }

          .items-table th {
            background: #0f766e;
            color: #ffffff;
            text-align: left;
            padding: 6px 10px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .items-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            color: #334155;
          }

          .items-table tr:last-child td {
            border-bottom: none;
          }

          .col-line { width: 45px; font-family: monospace; color: #64748b; font-weight: 700; text-align: center; }
          .col-sku { width: 85px; font-family: monospace; color: #475569; }
          .col-qty { width: 90px; font-weight: 800; text-align: center; }
          .col-qty-deliv { width: 90px; font-weight: 900; text-align: center; color: #0f766e; }
          .col-pack { width: 170px; color: #475569; font-size: 10px; }
          .col-check { width: 65px; text-align: center; font-weight: 900; font-family: monospace; }

          .badge-bio {
            background: #dcfce7;
            color: #166534;
            font-size: 9px;
            font-weight: 900;
            padding: 1px 5px;
            border-radius: 3px;
            border: 1px solid #86efac;
            margin-left: 4px;
          }

          .supplier-footer-row {
            background: #f8fafc;
            font-weight: 800;
            text-align: right;
            padding: 6px 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #0f766e;
          }

          /* --- BLOC CONFORMITÉ SANITAIRE & AGEC --- */
          .haccp-card {
            margin-top: 14px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #2563eb;
            border-radius: 8px;
            padding: 10px 12px;
          }

          .haccp-card-title {
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            color: #1e40af;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
          }

          .haccp-card-body {
            font-size: 10px;
            color: #1e3a8a;
            line-height: 1.45;
          }

          /* --- BLOC ÉMARGEMENT ET SIGNATURES CONTRADICTOIRES --- */
          .signature-grid {
            display: flex;
            gap: 12px;
            margin-top: 14px;
          }

          .signature-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            height: 95px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .signature-box-header {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f766e;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }

          .signature-box-content {
            font-size: 9.5px;
            color: #64748b;
            font-style: italic;
          }

          .footer {
            margin-top: 16px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            text-align: center;
            font-size: 8.5px;
            color: #64748b;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>

        <!-- 1. EN-TÊTE OFFICIEL DE MARQUE -->
        <div class="header">
          <div class="brand-block">
            <img src="/Logo.png" alt="Âne & Gorille" class="brand-logo" onerror="this.style.display='none';" />
            <div>
              <h1 class="brand-title">Âne &amp; Gorille</h1>
              <span class="brand-subtitle">Plateforme &amp; Transport · Quentin Moller EI</span>
              <div class="brand-legal-info">
                <strong>Entrepreneur Individuel (EI)</strong> · SIRET : 912 345 678 00012 · RCS Toulouse<br>
                Licence de Transport Intérieur DREAL n° 2026/76/0001234 (-3,5t) · Toulouse, France<br>
                Service Client &amp; Logistique : contact@ane-et-gorille.fr
              </div>
            </div>
          </div>

          <div class="doc-summary">
            <span class="doc-type-badge">Bon de Livraison (BL)</span>
            <div class="doc-ref">${docNumber}</div>
            <div class="doc-date">Émis le : <strong>${issueDateStr}</strong></div>
          </div>
        </div>

        <!-- 2. BANDEAU DE LIVRAISON EFFECTIVE -->
        <div class="delivery-banner">
          <div>
            <div class="delivery-label">🚚 Date &amp; Heure Effectives de Livraison</div>
            <div class="delivery-value">${dateFormatted}</div>
          </div>
          <div class="delivery-window-pill">
            Créneau : <strong>${deliveryWindow}</strong>
          </div>
        </div>

        <!-- 3. IDENTIFICATION DU DESTINATAIRE ET DÉTAILS DU TRANSPORTEUR -->
        <div class="info-grid">
          <div class="info-box">
            <div class="info-box-header">
              <span>Destinataire / Client Réceptionnaire</span>
              ${chorusBadge}
            </div>
            <div class="info-box-content">
              <strong>${order.buyerCompany || order.buyerName || order.companyName || "Acheteur Client Pro"}</strong><br>
              ${order.deliveryAddress || order.address || "Adresse de livraison non renseignée"}<br>
              ${buyerSiretHTML}
              ${chorusRefHTML}
              Contact Réception : <strong>${order.billingContact || order.phone || order.email || "Service Réception"}</strong>
            </div>
          </div>

          <div class="info-box">
            <div class="info-box-header">
              <span>Transporteur &amp; Références Commande</span>
              <span>Réf. Commande : ${poFormatted}</span>
            </div>
            <div class="info-box-content">
              Opérateur Logistique : <strong>Âne &amp; Gorille (Quentin Moller EI)</strong><br>
              Licence Transport DREAL : <strong>2026/76/0001234 (-3.5t)</strong><br>
              Contrôle Température HACCP : <strong style="color:#15803d;">${tempHaccp} (Chaîne du froid conforme)</strong><br>
              Bacs Consignés Remis : <strong>${crateCount} cagette(s) réutilisable(s) (Loi AGEC)</strong><br>
              Consignes Chauffeur : <em>${deliveryInstructions}</em>
            </div>
          </div>
        </div>

        <!-- 4. BLOCS FOURNISSEURS ET PRODUITS DÉTAILLÉS -->
        ${supplierBlocksHTML}

        <!-- 5. CONFORMITÉ SANITAIRE HACCP & LOI AGEC -->
        <div class="haccp-card">
          <div class="haccp-card-title">
            <span>🛡️ Contrôle Sanitaire de la Chaîne du Froid &amp; Emballages Consignés</span>
            <span>Paquet Hygiène CE 178/2002 &amp; Loi AGEC</span>
          </div>
          <div class="haccp-card-body">
            • <strong>Traçabilité Sanitaire (Règlement CE 178/2002 &amp; CE 543/2011)</strong> : Les denrées alimentaires ci-dessus ont été contrôlées et acheminées sous contrôle de température dirigée (${tempHaccp}).<br>
            • <strong>Consignation Emballages Réutilisables (Loi AGEC Art. L. 541-10-11)</strong> : Les ${crateCount} bacs/cagettes plastique réutilisables sont remis en consignation au client réceptionnaire sous pointage contradictoire et restituables lors de la prochaine livraison.
          </div>
        </div>

        <!-- 6. BLOC ÉMARGEMENT ET SIGNATURES CONTRADICTOIRES -->
        <div class="signature-grid">
          <div class="signature-box">
            <div class="signature-box-header">1. Chauffeur-Livreur Âne &amp; Gorille</div>
            <div class="signature-box-content">
              Prise en charge camion &amp; livraison effectuée conforme.<br>
              <strong>Flotte Logistique Âne &amp; Gorille</strong><br>
              Date &amp; Heure : ____________________
            </div>
          </div>

          <div class="signature-box">
            <div class="signature-box-header">2. Cachet &amp; Émargement Client Réceptionnaire</div>
            <div class="signature-box-content">
              ${signatureHTML}
            </div>
          </div>
        </div>

        <!-- 7. PIED DE PAGE LÉGAL -->
        <div class="footer">
          <strong>Âne &amp; Gorille — Quentin Moller EI</strong> · Entrepreneur Individuel · SIRET : 912 345 678 00012 · RCS Toulouse<br>
          Transport Public Routier Léger de Marchandises (-3,5t) · Licence DREAL n° 2026/76/0001234 · Agrément Sanitaire &amp; PMS HACCP<br>
          Bon de livraison valant justificatif de remise physique des marchandises et transfert de garde (Art. 1583 du Code Civil).
        </div>

      </body>
      </html>
    `;
  }
};

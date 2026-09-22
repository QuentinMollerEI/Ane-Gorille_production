/**
 * 📜 GENERATEUR UNIQUE : OrderSlipGenerator.js
 * Emplacement : src/services/documents/OrderSlipGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Génération du Bon de Commande (Order Slip / Purchase Order) B2B/B2G
 * - Charte graphique officielle Âne & Gorille (Vert Émeraude #0f766e, Or/Moutarde #d97706, Slate)
 * - Logo officiel avec gestion du repli
 * - Ergonomique, visuel et parfaitement lisible
 * - Complet juridiquement (Mentions EI Quentin Moller, Art. 289-I-2 CGI, DREAL, HACCP, Chorus Pro B2G, LME 30j)
 */

export const OrderSlipGenerator = {

  /**
   * Génère le code HTML imprimable et téléchargeable du Bon de Commande
   * @param {Object} order - La commande consolidée Firestore
   * @returns {string} Code HTML structuré
   */
  generateHTML(order) {
    if (!order) return "<p style='font-family:sans-serif; color:red; font-weight:bold;'>Erreur: Aucune donnée de commande fournie.</p>";

    // 1. Horodatages et Identifiants
    const orderRefNumber = order.orderNumber || order.id?.substring(0, 8).toUpperCase() || "CMD-2026";
    const poFormatted = `PO-${orderRefNumber.toString().replace(/^PO-/, '')}`;
    
    const issueDateStr = order.createdAt?.toDate 
      ? order.createdAt.toDate().toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date().toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });

    // 2. Gestion de la Date de Livraison Souhaitée par l'Acheteur
    const selectedDateRaw = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "";
    let dateFormatted = "À définir";
    if (selectedDateRaw) {
      try {
        const d = new Date(selectedDateRaw);
        if (!isNaN(d.getTime())) {
          dateFormatted = d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          // Capitaliser le premier lettre du jour
          dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
        } else {
          dateFormatted = selectedDateRaw;
        }
      } catch (e) {
        dateFormatted = selectedDateRaw;
      }
    }

    const deliveryWindow = order.deliveryDetails?.deliveryWindow || order.deliveryWindow || "Créneau Matin (06h00 - 08h00)";
    const deliveryInstructions = order.deliveryDetails?.instructions || order.instructions || "Aucune consigne particulière";

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
          items: [],
          subtotalHT: 0
        };
      }
      const qty = Number(item.quantity || item.qty || 1);
      const priceHT = Number(item.priceHT ?? item.price ?? 0);
      const vatRate = Number(item.vatRate ?? 5.5);
      const lineHT = qty * priceHT;
      const batchNumber = item.batchNumber || item.lotNumber || "HACCP-FR";

      acc[pId].items.push({
        ...item,
        qty,
        priceHT,
        vatRate,
        lineHT,
        batchNumber
      });
      acc[pId].subtotalHT += lineHT;
      return acc;
    }, {});

    // 4. Calculs financiers globaux et règle dégressive transport
    const totalProductsHT = Object.values(groupedByProducer).reduce((sum, g) => sum + g.subtotalHT, 0);
    
    // Extraction ou calcul dégressif des frais de port B2B
    let deliveryFeeHT = Number(
      order.deliveryFee ?? 
      order.deliveryFeeHT ?? 
      order.shippingFee ?? 
      order.deliveryDetails?.deliveryFee ?? 
      -1
    );

    if (deliveryFeeHT < 0) {
      if (totalProductsHT >= 300) {
        deliveryFeeHT = 0;
      } else if (totalProductsHT >= 150) {
        deliveryFeeHT = 8;
      } else if (totalProductsHT > 0) {
        deliveryFeeHT = 15;
      } else {
        deliveryFeeHT = 0;
      }
    }

    // Calcul de la TVA ventilée
    let vatProducts = 0;
    items.forEach((item) => {
      const q = Number(item.quantity || item.qty || 1);
      const p = Number(item.priceHT ?? item.price ?? 0);
      const rate = Number(item.vatRate ?? 5.5);
      vatProducts += (q * p * (rate / 100));
    });

    const vatDelivery = deliveryFeeHT * 0.20; // TVA 20% sur la livraison B2B
    const calculatedTotalHT = totalProductsHT;
    const totalVAT = vatProducts + vatDelivery;
    const totalTTC = calculatedTotalHT + deliveryFeeHT + totalVAT;

    // Mode de règlement
    const isChorus = order.paymentMethod === 'mandat_public' || order.paymentMethod === 'mandat';
    const paymentMethodLabel = isChorus 
      ? 'Mandat Public Administratif (Chorus Pro 30j)' 
      : (order.paymentMethod === 'virement_b2b' ? 'Virement B2B (LME 30 jours)' : 'Carte Bancaire / SEPA (Stripe B2B)');

    // 5. Template HTML imprimable
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bon de Commande - ${poFormatted}</title>
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
            min-width: 210px;
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
          .col-qty { width: 80px; font-weight: 800; text-align: center; }
          .col-price { width: 95px; text-align: right; font-family: monospace; }
          .col-vat { width: 50px; text-align: center; font-size: 10px; color: #64748b; }
          .col-total { width: 100px; text-align: right; font-weight: 900; font-family: monospace; color: #0f172a; }

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

          /* --- RÉCAPITULATIF FINANCIER GLOBAL --- */
          .financial-card {
            margin-top: 14px;
            border: 2px solid #0f766e;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }

          .financial-card-header {
            background: #0f766e;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 6px 12px;
            letter-spacing: 0.6px;
            display: flex;
            justify-content: space-between;
          }

          .financial-card-body {
            padding: 10px 14px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 11px;
            color: #334155;
          }

          .summary-row.highlight {
            font-weight: 800;
            color: #0f766e;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
            margin-top: 4px;
          }

          .summary-total-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 900;
            border-top: 2px solid #d97706;
          }

          .total-amount-highlight {
            font-size: 16px;
            color: #f59e0b;
            font-family: 'Courier New', Courier, monospace;
          }

          /* --- CLAUSE ET MANDAT LÉGAL --- */
          .legal-mandate-box {
            margin-top: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #d97706;
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 9.5px;
            color: #475569;
            line-height: 1.4;
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
            <span class="doc-type-badge">Bon de Commande</span>
            <div class="doc-ref">${poFormatted}</div>
            <div class="doc-date">Date d'émission : <strong>${issueDateStr}</strong></div>
          </div>
        </div>

        <!-- 2. BANDEAU DE LIVRAISON PROGRAMMÉE -->
        <div class="delivery-banner">
          <div>
            <div class="delivery-label">📅 Date de Livraison Souhaitée par l'Acheteur</div>
            <div class="delivery-date">${dateFormatted}</div>
          </div>
          <div class="delivery-window-pill">
            Créneau : <strong>${deliveryWindow}</strong>
          </div>
        </div>

        <!-- 3. IDENTIFICATION DU CLIENT ET DÉTAILS COMPTABLES -->
        <div class="info-grid">
          <div class="info-box">
            <div class="info-box-header">
              <span>Client / Acheteur Pro</span>
              ${isChorus ? `<span class="badge-b2g">Secteur Public (B2G)</span>` : `<span style="color:#0f766e; font-weight:800;">B2B Privé</span>`}
            </div>
            <div class="info-box-content">
              <strong>${order.buyerName || order.companyName || "Acheteur Client Pro"}</strong><br>
              ${order.deliveryAddress || order.address || "Adresse de livraison non renseignée"}<br>
              ${order.siretBuyer && order.siretBuyer !== '-' ? `SIRET Client : <strong>${order.siretBuyer}</strong><br>` : ''}
              ${isChorus && order.refEngagement && order.refEngagement !== '-' ? `N° Engagement Chorus Pro : <strong style="color:#1e40af;">${order.refEngagement}</strong>` : ''}
            </div>
          </div>

          <div class="info-box">
            <div class="info-box-header">
              <span>Synthèse de la Commande</span>
              <span>Réf. #${orderRefNumber}</span>
            </div>
            <div class="info-box-content">
              Mode de Règlement : <strong>${paymentMethodLabel}</strong><br>
              Statut de la Commande : <strong style="color:#0f766e;">${(order.status || "VALIDÉE").toUpperCase()}</strong><br>
              Conditionnement : <strong>Bacs &amp; Caisses Réutilisables (Loi AGEC)</strong><br>
              Consignes Logistiques : <em>${deliveryInstructions}</em>
            </div>
          </div>
        </div>

        <!-- 4. BLOCS FOURNISSEURS ET PRODUITS DÉTAILLÉS -->
        ${Object.entries(groupedByProducer).map(([pId, group], index) => {
          const supplierIndex = index + 1;
          return `
            <div class="supplier-block">
              <div class="supplier-header">
                <div class="supplier-title">
                  <span class="supplier-tag">Fournisseur ${supplierIndex}</span>
                  <span>${group.producerName}</span>
                  ${group.producerCity ? `<small style="font-weight:600; color:#64748b; text-transform:none;">(${group.producerCity}${group.producerDept ? `, ${group.producerDept}` : ''})</small>` : ''}
                </div>
                <div style="font-size: 10px; font-weight: 800; color: #0f766e; font-family: monospace;">
                  Réf. Maraîcher : ${pId.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th class="col-line">Ligne</th>
                    <th class="col-sku">Code Réf.</th>
                    <th>Désignation Produit &amp; Traçabilité</th>
                    <th class="col-qty">Quantité</th>
                    <th class="col-price">Prix Unit. HT</th>
                    <th class="col-vat">TVA</th>
                    <th class="col-total">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.items.map((item, lIdx) => {
                    const lineNum = String(lIdx + 1).padStart(3, '0');
                    const sku = (item.id || item.productId || 'SKU').substring(0, 10).toUpperCase();
                    return `
                      <tr>
                        <td class="col-line">${lineNum}</td>
                        <td class="col-sku">${sku}</td>
                        <td>
                          <strong>${item.name || item.title || "Produit Maraîcher"}</strong>
                          ${item.isBio ? `<span class="badge-bio">BIO</span>` : ''}
                          ${item.unit ? `<small style="color: #64748b;"> (${item.unit})</small>` : ''}
                          <br><small style="color: #64748b; font-size: 9px;">N° Lot HACCP : ${item.batchNumber}</small>
                        </td>
                        <td class="col-qty">${item.qty} ${item.unit || 'kg'}</td>
                        <td class="col-price">${item.priceHT.toFixed(2)} €</td>
                        <td class="col-vat">${item.vatRate}%</td>
                        <td class="col-total">${item.lineHT.toFixed(2)} €</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <div class="supplier-footer-row">
                Sous-total Produits Fournisseur ${supplierIndex} (${group.producerName}) : <strong>${group.subtotalHT.toFixed(2)} € HT</strong>
              </div>
            </div>
          `;
        }).join('')}

        <!-- 5. VENTILATION FINANCIÈRE GLOBALE ET TRANSPARENCE -->
        <div class="financial-card">
          <div class="financial-card-header">
            <span>Ventilation Financière Consolidée</span>
            <span>Règlements &amp; Taxes</span>
          </div>

          <div class="financial-card-body">
            <div class="summary-row">
              <span>Total Brut Produits HT (${items.length} article${items.length > 1 ? 's' : ''}) :</span>
              <span style="font-family: monospace; font-weight: 800;">${totalProductsHT.toFixed(2)} € HT</span>
            </div>

            <div class="summary-row">
              <span>TVA Alimentation (5.5 %) :</span>
              <span style="font-family: monospace;">${vatProducts.toFixed(2)} €</span>
            </div>

            <div class="summary-row highlight">
              <span>🚚 Frais d'Expédition &amp; Transport B2B (Dégressifs) :</span>
              <span style="font-family: monospace; font-weight: 900; color: #0f766e;">
                ${deliveryFeeHT > 0 ? `${deliveryFeeHT.toFixed(2)} € HT` : "0.00 € (Livraison Offerte / Franco de port)"}
              </span>
            </div>

            ${deliveryFeeHT > 0 ? `
              <div class="summary-line summary-row">
                <span>TVA Transport (20.0 %) :</span>
                <span style="font-family: monospace;">${vatDelivery.toFixed(2)} €</span>
              </div>
            ` : ''}

            <div class="summary-row" style="border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px;">
              <span>Total Général HT :</span>
              <span style="font-family: monospace; font-weight: 800;">${(calculatedTotalHT + deliveryFeeHT).toFixed(2)} € HT</span>
            </div>

            <div class="summary-row">
              <span>Total TVA Cumulée :</span>
              <span style="font-family: monospace; font-weight: 800;">${totalVAT.toFixed(2)} €</span>
            </div>
          </div>

          <div class="summary-total-banner">
            <span>MONTANT TOTAL DU BON DE COMMANDE :</span>
            <span class="total-amount-highlight">${totalTTC.toFixed(2)} € TTC</span>
          </div>
        </div>

        <!-- 6. CLAUSE ET MANDAT LÉGAL -->
        <div class="legal-mandate-box">
          <strong>Mandat de Facturation &amp; Rôle de la Plateforme (Art. 289-I-2 du CGI) :</strong><br>
          Le présent bon de commande est émis par la plateforme <strong>Âne &amp; Gorille</strong> (Quentin Moller EI) agissant en qualité d'intermédiaire transparent et mandataire de facturation au nom et pour le compte des producteurs/vendeurs partenaires. La vente intervient en direct entre le producteur et l'acheteur.<br>
          <strong>Conditions de règlement :</strong> Règlement à 30 jours fin de mois conformément à la loi LME. En cas de retard de paiement, une pénalité égale au taux d'intérêt légal de la BCE majoré de 10 points sera appliquée de plein droit, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (Art. D. 441-5 du Code de commerce).
        </div>

        <!-- 7. PIED DE PAGE -->
        <div class="footer">
          <strong>Âne &amp; Gorille — Quentin Moller EI</strong> · Entrepreneur Individuel · SIRET : 912 345 678 00012 · RCS Toulouse<br>
          Transport Public Routier Léger de Marchandises (-3,5t) · Agrément Sanitaire &amp; PMS HACCP (< 24h Cross-Docking)<br>
          Document commercial généré automatiquement par la plateforme Âne &amp; Gorille.
        </div>

      </body>
      </html>
    `;
  }
};

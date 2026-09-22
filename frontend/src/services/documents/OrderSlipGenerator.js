/**
 * 📜 GENERATEUR UNIQUE : OrderSlipGenerator.js
 * Emplacement : src/services/documents/OrderSlipGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Ce module est DÉDIÉ EXCLUSIVEMENT à la génération du Bon de Commande (Order Slip).
 * Aucun risque de régression lors de la modification des bons de livraison ou de préparation !
 */

export const OrderSlipGenerator = {

  /**
   * Génère le code HTML imprimable/téléchargeable du Bon de Commande
   * @param {Object} order - La commande consolidée Firestore
   * @returns {string} Code HTML structuré aux couleurs Âne & Gorille
   */
  generateHTML(order) {
    if (!order) return "<p>Erreur: Aucune donnée de commande fournie.</p>";

    // 1. Gestion de la Date de Livraison Souhaitée
    const selectedDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "Non spécifiée";
    const dateFormatted = selectedDate !== "Non spécifiée" 
      ? new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
      : "À définir";

    // 2. Extraction dynamique des Frais de Livraison du Panier
    let deliveryFeeHT = Number(
      order.deliveryFee ?? 
      order.deliveryFeeHT ?? 
      order.shippingFee ?? 
      order.deliveryDetails?.deliveryFee ?? 
      0
    );

    // 3. Regroupement strict des articles par Maraîcher / Fournisseur
    const items = order.items || [];
    const groupedByProducer = items.reduce((acc, item) => {
      const pId = item.producerId || item.userId || "PROD_INCONNOU";
      const pName = item.producerName || item.producerCompany || item.companyName || "Maraîcher Local";
      if (!acc[pId]) {
        acc[pId] = {
          producerName: pName,
          producerAddress: item.producerAddress || "",
          producerCity: item.producerCity || "",
          items: [],
          subtotalHT: 0
        };
      }
      const qty = Number(item.quantity || item.qty || 1);
      const priceHT = Number(item.priceHT ?? item.price ?? 0);
      const lineHT = qty * priceHT;
      
      acc[pId].items.push({ ...item, qty, priceHT, lineHT });
      acc[pId].subtotalHT += lineHT;
      return acc;
    }, {});

    // 4. Calculs financiers globaux
    const totalProductsHT = Object.values(groupedByProducer).reduce((sum, g) => sum + g.subtotalHT, 0);
    const calculatedTotalHT = Number(order.totalHT ?? order.amountHT ?? totalProductsHT);

    // Recalcul des frais de port si non renseignés
    if (deliveryFeeHT === 0 && calculatedTotalHT < 300) {
      if (calculatedTotalHT >= 150) deliveryFeeHT = 8;
      else deliveryFeeHT = 15;
    }

    const vatProducts = calculatedTotalHT * 0.055; // TVA 5,5% sur les denrées alimentaires
    const vatDelivery = deliveryFeeHT * 0.20; // TVA 20% sur la livraison
    const computedTotalVAT = vatProducts + vatDelivery;
    const computedTotalTTC = calculatedTotalHT + deliveryFeeHT + computedTotalVAT;

    const rawTotalTTC = Number(order.totalTTC ?? order.totalAmount ?? order.amountTTC ?? order.amount ?? 0);
    const totalTTC = (rawTotalTTC >= computedTotalTTC && rawTotalTTC > calculatedTotalHT + 5) ? rawTotalTTC : computedTotalTTC;

    // 5. Code HTML du Bon de Commande
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Commande - ${order.orderNumber || order.id || "PO-2026"}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 15px; line-height: 1.4; background: #ffffff; }
          
          /* EN-TÊTE ÂNE & GORILLE */
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 15px; }
          .brand-container { display: flex; align-items: center; gap: 12px; }
          .brand-logo { height: 48px; width: auto; object-fit: contain; }
          .brand-title { font-size: 20px; font-weight: 900; color: #0f766e; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1; }
          .brand-subtitle { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 3px; display: block; }
          .brand-legal { font-size: 9px; color: #475569; margin-top: 2px; }
          
          .doc-type { text-align: right; }
          .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; }
          .doc-po { font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }
          
          /* BANDEAU DATE DE LIVRAISON SOUHAITÉE */
          .delivery-banner { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 10px 14px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .delivery-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 0.5px; }
          .delivery-date { font-size: 16px; font-weight: 900; color: #166534; margin-top: 2px; }
          .delivery-slot { font-size: 10px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 3px 8px; rounded-md: 4px; border: 1px solid #86efac; }
          
          /* GRILLE DE COORDONNÉES (AMAZON BUSINESS STYLE) */
          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; }
          
          /* BLOCS FOURNISSEURS / MARAÎCHERS */
          .supplier-block { border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; overflow: hidden; background: #ffffff; }
          .supplier-header { background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
          .supplier-name { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
          .supplier-sub { font-size: 10px; color: #64748b; font-weight: 600; }
          
          /* TABLEAU DE DÉTAIL DES ARTICLES */
          table { width: 100%; border-collapse: collapse; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }
          .col-line { width: 45px; font-family: monospace; color: #64748b; font-weight: 700; }
          .col-sku { width: 90px; font-family: monospace; color: #475569; }
          .col-qty { width: 80px; font-weight: 800; text-align: center; }
          .col-price { width: 100px; text-align: right; font-family: monospace; }
          .col-vat { width: 50px; text-align: center; font-size: 10px; color: #64748b; }
          .col-total { width: 100px; text-align: right; font-weight: 800; font-family: monospace; color: #0f172a; }
          
          .supplier-total-row { background: #f8fafc; font-weight: 800; text-align: right; padding: 6px 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #0f766e; }
          
          /* RECAPITULATIF FINANCIER GLOBAL */
          .financial-summary { margin-top: 15px; border: 2px solid #0f766e; border-radius: 8px; overflow: hidden; background: #ffffff; }
          .financial-header { background: #0f766e; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 6px 12px; letter-spacing: 0.5px; }
          .financial-body { padding: 10px 14px; }
          .summary-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #334155; }
          .summary-line.highlight { font-weight: 800; color: #0f766e; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 2px; }
          .summary-total { display: flex; justify-content: space-between; background: #0f172a; color: #ffffff; padding: 14px; font-size: 14px; font-weight: 900; border-top: 2px solid #0f766e; }
          
          /* MENTIONS LEGALES PIED DE PAGE */
          .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b; line-height: 1.4; }
          .badge-bio { background: #dcfce7; color: #166534; font-size: 9px; font-weight: 800; padding: 1px 5px; rounded-md: 3px; border: 1px solid #86efac; margin-left: 5px; }
        </style>
      </head>
      <body>

        <!-- 1. EN-TÊTE OFFICIEL -->
        <div class="header">
          <div class="brand-container">
            <img src="/Logo.png" alt="Âne & Gorille" class="brand-logo" onerror="this.style.display='none'" />
            <div>
              <span class="brand-title">Âne & Gorille</span>
              <span class="brand-subtitle">Quentin Moller EI</span>
              <div class="brand-legal">
                Plateforme & Transport · SIRET : 912 345 678 00012 · RCS Toulouse<br>
                Licence Transport DREAL n° 2026/76/0001234 (-3,5t) · Toulouse, France
              </div>
            </div>
          </div>

          <div class="doc-type">
            <div class="doc-title">Bon de Commande</div>
            <div class="doc-po">PO-${(order.orderNumber || order.id || "").toString().replace(/^PO-/, '')}</div>
            <small style="color: #64748b; font-weight: 700;">Date d'émission : ${new Date().toLocaleDateString("fr-FR")}</small>
          </div>
        </div>

        <!-- 2. DATE DE LIVRAISON SOUHAITÉE PAR L'ACHETEUR -->
        <div class="delivery-banner">
          <div>
            <div class="delivery-title">📅 Date de Livraison Souhaitée par l'Acheteur</div>
            <div class="delivery-date">${dateFormatted} (${selectedDate})</div>
          </div>
          <div class="delivery-slot">
            Créneau : ${order.deliveryDetails?.deliveryWindow || "Matin (06h00 - 08h00)"}
          </div>
        </div>

        <!-- 3. COORDONNÉES ACHETEUR & COMMANDE -->
        <div class="grid">
          <div class="box">
            <div class="box-title">Client / Acheteur</div>
            <div class="box-content">
              <strong>${order.buyerName || order.companyName || "Acheteur Client"}</strong><br>
              ${order.deliveryAddress || order.address || "Adresse de livraison non renseignée"}<br>
              ${order.siretBuyer ? `SIRET : <strong>${order.siretBuyer}</strong><br>` : ''}
              ${order.refEngagement ? `N° Engagement Chorus Pro : <strong>${order.refEngagement}</strong>` : ''}
            </div>
          </div>

          <div class="box">
            <div class="box-title">Détails Synthèse Commande</div>
            <div class="box-content">
              N° Commande : <strong>${order.orderNumber || order.id}</strong><br>
              Mode de Règlement : <strong>${order.paymentMethod === 'mandat_public' ? 'Mandat Public (Chorus Pro 30j)' : 'Règlement B2B'}</strong><br>
              Statut : <strong style="color: #0f766e;">${order.status || "VALIDÉE"}</strong><br>
              Consignes : ${order.deliveryDetails?.instructions || "Aucune"}
            </div>
          </div>
        </div>

        <!-- 4. BLOCS FOURNISSEURS / MARAÎCHERS (STYLE AMAZON BUSINESS) -->
        ${Object.entries(groupedByProducer).map(([pId, group], index) => {
          const supplierNum = index + 1;
          return `
            <div class="supplier-block">
              <div class="supplier-header">
                <div>
                  <span class="supplier-name">[ BLOC FOURNISSEUR ${supplierNum} : ${group.producerName} ]</span>
                  ${group.producerCity ? `<span class="supplier-sub"> — Localisation : ${group.producerCity}</span>` : ''}
                </div>
                <div style="font-size: 10px; font-weight: 800; color: #0f766e;">
                  Réf. Exploitant : ${pId.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th className="col-line">Ligne</th>
                    <th className="col-sku">Réf.</th>
                    <th>Désignation Produit</th>
                    <th className="col-qty">Quantité</th>
                    <th className="col-price">Prix Unit. HT</th>
                    <th className="col-vat">TVA</th>
                    <th className="col-total">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.items.map((item, lIdx) => {
                    const lineNum = String(lIdx + 1).padStart(4, '0');
                    const sku = (item.id || item.productId || 'SKU').substring(0, 10).toUpperCase();
                    return `
                      <tr>
                        <td class="col-line">${lineNum}</td>
                        <td class="col-sku">${sku}</td>
                        <td>
                          <strong>${item.name || item.title || "Produit Maraîcher"}</strong>
                          ${item.isBio ? `<span class="badge-bio">BIO</span>` : ''}
                          ${item.unit ? `<small style="color: #64748b;"> (${item.unit})</small>` : ''}
                        </td>
                        <td class="col-qty">${item.qty} ${item.unit || 'kg'}</td>
                        <td class="col-price">${item.priceHT.toFixed(2)} €</td>
                        <td class="col-vat">${item.vatRate || 5.5}%</td>
                        <td class="col-total">${item.lineHT.toFixed(2)} €</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <div class="supplier-total-row">
                Sous-total Fournisseur ${supplierNum} (${group.producerName}) : <strong>${group.subtotalHT.toFixed(2)} € HT</strong>
              </div>
            </div>
          `;
        }).join('')}

        <!-- 5. VENTILATION FINANCIÈRE GLOBALE -->
        <div class="financial-summary">
          <div class="financial-header">================ VENTILATION FINANCIÈRE GLOBALE ================</div>
          <div class="financial-body">
            <div class="summary-line">
              <span>Total Brut Produits HT :</span>
              <span style="font-family: monospace; font-weight: 700;">${calculatedTotalHT.toFixed(2)} € HT</span>
            </div>

            <div class="summary-line">
              <span>TVA Estimée sur Produits (5,5 %) :</span>
              <span style="font-family: monospace;">${vatProducts.toFixed(2)} €</span>
            </div>

            <div class="summary-line highlight">
              <span>🚚 Frais d'Expédition Globaux B2B (Livraison) :</span>
              <span style="font-family: monospace; font-weight: 800; color: #0f766e;">
                ${deliveryFeeHT > 0 ? `${deliveryFeeHT.toFixed(2)} € HT` : "0.00 € (Livraison Offerte)"}
              </span>
            </div>

            ${deliveryFeeHT > 0 ? `
              <div class="summary-line">
                <span>TVA sur Frais de Livraison (20 %) :</span>
                <span style="font-family: monospace;">${vatDelivery.toFixed(2)} €</span>
              </div>
            ` : ''}
          </div>

          <div class="summary-total">
            <span>MONTANT TOTAL DU BON DE COMMANDE :</span>
            <span>${totalTTC.toFixed(2)} € TTC</span>
          </div>
        </div>

        <!-- 6. FOOTER LÉGAL -->
        <div class="footer">
          <strong>Âne & Gorille — Quentin Moller EI</strong> (Entrepreneur Individuel)<br>
          Plateforme d'Intermédiation & Transport Léger de Marchandises (-3,5t)<br>
          Document commercial généré automatiquement par la plateforme Âne & Gorille.
        </div>

      </body>
      </html>
    `;
  }
};

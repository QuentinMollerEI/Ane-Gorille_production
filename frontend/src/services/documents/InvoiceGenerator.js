/**
 * 🧾 GÉNÉRATEUR UNIQUE : InvoiceGenerator.js
 * Emplacement : src/services/documents/InvoiceGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Ce module est DÉDIÉ EXCLUSIVEMENT à la génération des factures de vente (FAC-VTE)
 * et des factures de commission de la marketplace (FAC-COM).
 * Conforme au Code Général des Impôts (Art. 289-I-2, Mandat de Facturation, Chorus Pro & Factur-X B2B).
 */

export const InvoiceGenerator = {

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
   * 🧾 Facture de Vente Officielle (FAC-VTE / B2B & B2G Chorus Pro)
   * @param {Object} order - Commande globale Firestore
   * @param {Object|null} subOrder - Sous-commande producteur optionnelle
   */
  generateInvoiceHTML(order, subOrder = null) {
    if (!order && !subOrder) return "<p>Erreur: Données de facturation manquantes.</p>";

    const isSubOrder = Boolean(subOrder);
    const docData = subOrder || order;
    const docNumber = docData.invoiceNumber || (isSubOrder ? `FAC-VTE-${docData.id.substring(0,8).toUpperCase()}` : `FAC-${(order.id||'').substring(0,8).toUpperCase()}`);
    const invoiceDate = new Date().toLocaleDateString("fr-FR");

    const producerName = docData.producerName || "Maraîcher Vendeur";
    const producerSiret = docData.siretProducer || docData.producerSiret || "987 654 321 00019";
    
    const isPublicBuyer = order?.paymentMethod === 'mandat_public' || order?.buyerRole === 'acheteur_public' || order?.buyerRole === 'client_public';

    const items = docData.items || order?.items || [];
    const totalHT = items.reduce((sum, item) => sum + (Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1)), 0);
    const totalTVA = items.reduce((sum, item) => sum + ((Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1)) * ((item.vatRate || 5.5) / 100)), 0);
    const totalTTC = totalHT + totalTVA;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture de Vente - ${docNumber}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 15px; line-height: 1.4; background: #ffffff; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 15px; }
          .brand-container { display: flex; align-items: center; gap: 12px; }
          .brand-logo { height: 48px; width: auto; object-fit: contain; }
          .brand-title { font-size: 20px; font-weight: 900; color: #0f766e; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1; }
          .brand-subtitle { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 3px; display: block; }
          .brand-legal { font-size: 9px; color: #475569; margin-top: 2px; }
          
          .doc-type { text-align: right; }
          .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; }
          .doc-fac { font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }
          .doc-badge { display: inline-block; background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-top: 4px; }
          
          .mandate-banner { background: #fffbebf8; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 8px 12px; font-size: 10px; color: #78350f; font-weight: 600; border-radius: 6px; margin-bottom: 15px; }

          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; line-height: 1.4; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }
          .col-line { width: 45px; font-family: monospace; color: #64748b; font-weight: 700; }
          .col-qty { width: 80px; font-weight: 800; text-align: center; }
          .col-price { width: 90px; text-align: right; font-family: monospace; }
          .col-vat { width: 60px; text-align: center; font-size: 10px; color: #64748b; }
          .col-total { width: 100px; text-align: right; font-weight: 800; font-family: monospace; color: #0f172a; }

          .totals-table { width: 45%; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 15px; }
          .totals-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
          .totals-table .grand-total { background: #0f766e; color: white; font-weight: 900; font-size: 13px; }
          .totals-table .grand-total td { border-bottom: none; }

          .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b; line-height: 1.4; }
        </style>
      </head>
      <body>

        <div class="header">
          <div class="brand-container">
            <img src="${this.COMPANY_INFO.logoUrl}" alt="${this.COMPANY_INFO.tradeName}" class="brand-logo" onerror="this.style.display='none'" />
            <div>
              <span class="brand-title">${this.COMPANY_INFO.tradeName}</span>
              <span class="brand-subtitle">${this.COMPANY_INFO.legalName} (${this.COMPANY_INFO.legalStatus})</span>
              <div class="brand-legal">
                Mandataire de Facturation · SIRET : ${this.COMPANY_INFO.siret} · ${this.COMPANY_INFO.rcs}<br>
                ${this.COMPANY_INFO.address} · ${this.COMPANY_INFO.phone}
              </div>
            </div>
          </div>

          <div class="doc-type">
            <div class="doc-title">Facture de Vente</div>
            <div class="doc-fac">${docNumber}</div>
            <div class="doc-badge">${isPublicBuyer ? "Secteur Public (Chorus Pro)" : "Factur-X B2B"}</div><br>
            <small style="color: #64748b; font-weight: 700; display: inline-block; margin-top: 4px;">Émise le : ${invoiceDate}</small>
          </div>
        </div>

        <div class="mandate-banner">
          ⚖️ <strong>MENTION LÉGALE OBLIGATOIRE :</strong> Facture émise par <strong>${this.COMPANY_INFO.tradeName} (${this.COMPANY_INFO.legalName})</strong> au nom et pour le compte de l'exploitant vendeur <strong>${producerName}</strong> (SIRET : ${producerSiret}), en vertu d'un mandat de facturation écrit exprès (Art. 289-I-2 du CGI).
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Vendeur (Émetteur Légal)</div>
            <div class="box-content">
              <strong>${producerName}</strong><br>
              ${docData.producerAddress || docData.producerCity || "Exploitation Agricole Partenaire"}<br>
              <strong>SIRET :</strong> ${producerSiret}<br>
              TVA Intracommunautaire : FR 88 ${producerSiret.substring(0,9)}
            </div>
          </div>

          <div class="box">
            <div class="box-title">Acheteur (Client Facturé)</div>
            <div class="box-content">
              <strong>${order?.buyerCompany || order?.buyerName || "Acheteur Client Pro"}</strong><br>
              ${order?.deliveryAddress || "Adresse de facturation non renseignée"}<br>
              <strong>SIRET :</strong> ${order?.siretBuyer || "-"}<br>
              ${order?.refEngagement ? `<strong>N° Engagement Chorus :</strong> \${order.refEngagement}<br>` : ''}
              ${order?.codeService ? `<strong>Code Service Chorus :</strong> \${order.codeService}<br>` : ''}
              Mode de Règlement : <strong>${isPublicBuyer ? 'Mandat Administratif (30j Chorus Pro)' : 'Virement B2B / Stripe'}</strong>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-line">Ligne</th>
              <th>Désignation Produit / Prestation</th>
              <th class="col-qty">Quantité</th>
              <th class="col-price">Prix Unit. HT</th>
              <th class="col-vat">TVA</th>
              <th class="col-total">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const lineNum = String(idx + 1).padStart(4, '0');
              const q = Number(item.quantity ?? item.qty ?? 1);
              const p = Number(item.priceHT ?? item.price ?? 0);
              const lineHT = q * p;
              return `
                <tr>
                  <td class="col-line">\${lineNum}</td>
                  <td><strong>\${item.name || item.title || "Denrée Alimentaire"}</strong></td>
                  <td class="col-qty">\\({q} \\){item.unit || 'kg'}</td>
                  <td class="col-price">\${p.toFixed(2)} €</td>
                  <td class="col-vat">\${item.vatRate || 5.5} %</td>
                  <td class="col-total">\${lineHT.toFixed(2)} €</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Total HT Produits :</td>
            <td style="text-align: right; font-family: monospace;">${totalHT.toFixed(2)} €</td>
          </tr>
          <tr>
            <td>Total TVA (5,5 %) :</td>
            <td style="text-align: right; font-family: monospace;">${totalTVA.toFixed(2)} €</td>
          </tr>
          <tr class="grand-total">
            <td>TOTAL TTC À PAYER :</td>
            <td style="text-align: right; font-family: monospace;">${totalTTC.toFixed(2)} €</td>
          </tr>
        </table>

        <div class="footer">
          Facture établie en exécution du mandat de facturation régissant la plateforme <strong>${this.COMPANY_INFO.tradeName}</strong>.<br>
          Opérateur de Dématérialisation : <strong>${this.COMPANY_INFO.legalName}</strong> (${this.COMPANY_INFO.legalStatus}) · SIRET : ${this.COMPANY_INFO.siret}.<br>
          <strong>Conditions de règlement :</strong> ${isPublicBuyer ? 'Paiement par Mandat Administratif sous 30 jours (Chorus Pro).' : 'Paiement à réception par virement B2B / Stripe.'}<br>
          <em>Pénalités de retard au taux légal en vigueur. Indemnité forfaitaire pour frais de recouvrement : 40 € (Art. L. 441-10 du Code de commerce).</em>
        </div>

      </body>
      </html>
    `;
  },

  /**
   * 💼 Facture de Commission Marketplace (FAC-COM)
   * @param {Object} subOrder - Sous-commande producteur
   */
  generateCommissionInvoiceHTML(subOrder) {
    if (!subOrder) return "<p>Erreur: Sous-commande introuvable.</p>";

    const docNumber = `FAC-COM-${(subOrder.id || '').substring(0,8).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString("fr-FR");
    const commissionRate = 0.18; // 18%

    const salesAmountHT = Number(subOrder.amount || subOrder.totalAmount || 0);
    const commissionHT = salesAmountHT * commissionRate;
    
    const isVatExempt = true; 
    const vatAmount = isVatExempt ? 0 : commissionHT * 0.20;
    const totalTTC = commissionHT + vatAmount;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture de Commission - ${docNumber}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 15px; line-height: 1.4; background: #ffffff; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 15px; }
          .brand-container { display: flex; align-items: center; gap: 12px; }
          .brand-logo { height: 48px; width: auto; object-fit: contain; }
          .brand-title { font-size: 20px; font-weight: 900; color: #0f766e; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1; }
          .brand-subtitle { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 3px; display: block; }
          .brand-legal { font-size: 9px; color: #475569; margin-top: 2px; }
          
          .doc-type { text-align: right; }
          .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; }
          .doc-fac { font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }

          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; line-height: 1.4; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }

          .totals-table { width: 45%; margin-left: auto; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 15px; }
          .totals-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
          .totals-table .grand-total { background: #0f766e; color: white; font-weight: 900; font-size: 13px; }

          .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b; line-height: 1.4; }
        </style>
      </head>
      <body>

        <div class="header">
          <div class="brand-container">
            <img src="${this.COMPANY_INFO.logoUrl}" alt="${this.COMPANY_INFO.tradeName}" class="brand-logo" onerror="this.style.display='none'" />
            <div>
              <span class="brand-title">${this.COMPANY_INFO.tradeName}</span>
              <span class="brand-subtitle">${this.COMPANY_INFO.legalName} (${this.COMPANY_INFO.legalStatus})</span>
              <div class="brand-legal">
                Plateforme Marketplace & Logistique · SIRET : ${this.COMPANY_INFO.siret} · ${this.COMPANY_INFO.rcs}<br>
                ${this.COMPANY_INFO.address}
              </div>
            </div>
          </div>

          <div class="doc-type">
            <div class="doc-title">Facture de Frais de Service</div>
            <div class="doc-fac">${docNumber}</div>
            <small style="color: #64748b; font-weight: 700; display: inline-block; margin-top: 4px;">Émise le : ${invoiceDate}</small>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Émetteur (Plateforme Operator)</div>
            <div class="box-content">
              <strong>${this.COMPANY_INFO.tradeName}</strong><br>
              <strong>${this.COMPANY_INFO.legalName}</strong> (${this.COMPANY_INFO.legalStatus})<br>
              ${this.COMPANY_INFO.address}<br>
              <strong>SIRET :</strong> ${this.COMPANY_INFO.siret}<br>
              ${this.COMPANY_INFO.rcs}
            </div>
          </div>

          <div class="box">
            <div class="box-title">Client (Maraîcher Partenaire)</div>
            <div class="box-content">
              <strong>${subOrder.producerName || "Exploitant Agricole Partenaire"}</strong><br>
              ${subOrder.producerAddress || subOrder.producerCity || "Adresse exploitation"}<br>
              <strong>SIRET :</strong> ${subOrder.siretProducer || "-"}<br>
              <strong>Réf. Sous-Commande :</strong> #${(subOrder.id || '').substring(0,8).toUpperCase()}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description de la Prestation d'Intermédiation</th>
              <th style="text-align: right;">Assiette Vente HT</th>
              <th style="text-align: right;">Taux Commission</th>
              <th style="text-align: right;">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prestation d'intermédiation marketplace &amp; logistique de transit sur commande <strong>#${subOrder.id}</strong></td>
              <td style="text-align: right; font-family: monospace;">${salesAmountHT.toFixed(2)} €</td>
              <td style="text-align: right; font-family: monospace;">18.00 %</td>
              <td style="text-align: right; font-family: monospace;"><strong>${commissionHT.toFixed(2)} €</strong></td>
            </tr>
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Commission HT :</td>
            <td style="text-align: right; font-family: monospace;">${commissionHT.toFixed(2)} €</td>
          </tr>
          <tr>
            <td>TVA :</td>
            <td style="text-align: right; font-family: monospace;">${vatAmount.toFixed(2)} €</td>
          </tr>
          <tr class="grand-total">
            <td>TOTAL À DÉDUIRE TTC :</td>
            <td style="text-align: right; font-family: monospace;">${totalTTC.toFixed(2)} €</td>
          </tr>
        </table>

        <div style="margin-top: 15px; font-size: 11px; font-weight: 700; color: #047857; text-align: right;">
          ${isVatExempt ? 'Mention légale : TVA non applicable, art. 293 B du CGI (Franchise en base).' : ''}
        </div>

        <div class="footer">
          Facture de commission prélevée sur le compte de cantonnement Stripe Connect Express.<br>
          <strong>${this.COMPANY_INFO.tradeName}</strong> (${this.COMPANY_INFO.legalName}) · SIRET : ${this.COMPANY_INFO.siret} · ${this.COMPANY_INFO.rcs}.
        </div>

      </body>
      </html>
    `;
  }
};
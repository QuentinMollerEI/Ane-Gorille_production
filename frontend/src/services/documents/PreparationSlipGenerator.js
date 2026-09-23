/**
 * 🌾 GÉNÉRATEUR UNIQUE : PreparationSlipGenerator.js
 * Emplacement : src/services/documents/PreparationSlipGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Ce module est DÉDIÉ EXCLUSIVEMENT à la génération de la Fiche de Récolte & Bon de Préparation
 * pour le maraîcher / producteur aux champs.
 * Conforme HACCP, Règlement CE 178/2002, CE 543/2011 et Loi AGEC.
 */

export const PreparationSlipGenerator = {

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
   * Helper d'extraction intelligente des quantités
   */
  extractQuantity(item) {
    if (!item) return 1;
    if (item.quantity !== undefined && item.quantity !== null && item.quantity !== "") return Number(item.quantity);
    if (item.qty !== undefined && item.qty !== null && item.qty !== "") return Number(item.qty);
    if (item.count !== undefined && item.count !== null && item.count !== "") return Number(item.count);
    if (item.preparedQty !== undefined && item.preparedQty !== null && item.preparedQty !== "") return Number(item.preparedQty);
    if (item.qtyPrepared !== undefined && item.qtyPrepared !== null && item.qtyPrepared !== "") return Number(item.qtyPrepared);
    return 1;
  },

  /**
   * Helper d'extraction de l'unité
   */
  extractUnit(item) {
    if (!item) return "kg";
    return item.unit || item.measureUnit || item.unite || "kg";
  },

  /**
   * Génère la Fiche de Récolte & Bon de Préparation (A4 imprimable)
   * @param {Object} subOrder - La sous-commande producteur
   * @param {Object|null} parentOrder - La commande globale parente
   * @returns {string} Code HTML
   */
  generateHTML(subOrder, parentOrder = null) {
    if (!subOrder) return "<p style='font-family:sans-serif; color:red; font-weight:bold;'>Erreur: Aucune sous-commande fournie pour la préparation.</p>";

    const selectedDateRaw = subOrder.selectedDate || parentOrder?.selectedDate || parentOrder?.deliveryDate || parentOrder?.deliveryDetails?.selectedDate || subOrder.deliveryDate || "";
    let dateFormatted = "Non spécifiée";
    if (selectedDateRaw) {
      try {
        const d = new Date(selectedDateRaw);
        if (!isNaN(d.getTime())) {
          dateFormatted = d.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
        } else {
          dateFormatted = selectedDateRaw;
        }
      } catch (e) {
        dateFormatted = selectedDateRaw;
      }
    }

    const docNumber = subOrder.id ? `PREP-${subOrder.id.substring(0, 8).toUpperCase()}` : "PREP-0001";
    const parentRefNumber = subOrder.parentOrderId || subOrder.orderId ? `#${(subOrder.parentOrderId || subOrder.orderId).substring(0, 8).toUpperCase()}` : "CMD-PRO";
    const buyerName = subOrder.buyerCompany || subOrder.buyerName || parentOrder?.buyerCompany || parentOrder?.buyerName || "Acheteur Client Pro";
    const deliveryAddress = subOrder.deliveryAddress || parentOrder?.deliveryAddress || "Adresse de livraison non renseignée";
    const producerName = subOrder.producerName || subOrder.producerCompany || "Exploitation Agricole Partenaire";
    const producerAddress = subOrder.producerAddress || subOrder.producerCity || "Adresse de l'exploitation";
    const siretProducer = subOrder.siretProducer || subOrder.producerSiret || "-";
    const lotNumber = subOrder.lotNumber || subOrder.batchNumber || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

    const items = subOrder.items || [];
    const itemRowsHTML = items.map((item, idx) => {
      const lineNum = String(idx + 1).padStart(3, '0');
      const sku = (item.id || item.productId || 'SKU').substring(0, 10).toUpperCase();
      const qty = this.extractQuantity(item);
      const unit = this.extractUnit(item);
      const name = item.name || item.title || "Légume / Produit Frais";
      const bioBadge = item.isBio ? ' <span style="background:#dcfce7; color:#166534; font-size:9px; font-weight:900; padding:1px 5px; border-radius:3px; border:1px solid #86efac;">BIO</span>' : '';

      return `
        <tr>
          <td style="text-align: center; font-family: monospace; color: #64748b; font-weight: 700;">${lineNum}</td>
          <td style="font-family: monospace; color: #475569;">${sku}</td>
          <td>
            <strong>${name}</strong>${bioBadge}
          </td>
          <td style="text-align: center;">
            <span style="background:#f0fdf4; color:#166534; font-size:13px; font-weight:900; font-family:monospace; padding:3px 8px; border-radius:4px; border:1px solid #bbf7d0;">${qty} ${unit}</span>
          </td>
          <td style="color:#475569; font-size:10px;">Cagette Plastique Pro Consignée (HACCP)</td>
          <td style="text-align: center; font-weight: 800; font-family: monospace;">[  ] Récolté</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fiche de Récolte - ${docNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm 12mm 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 10px; line-height: 1.45; background: #ffffff; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 14px; }
          .brand-container { display: flex; align-items: center; gap: 12px; }
          .brand-logo { height: 52px; width: auto; object-fit: contain; border-radius: 6px; }
          .brand-title { font-size: 21px; font-weight: 900; color: #0f766e; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1; margin: 0; }
          .brand-subtitle { font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; display: block; }
          .brand-legal { font-size: 9px; color: #475569; margin-top: 4px; line-height: 1.35; }
          
          .doc-summary { text-align: right; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; min-width: 210px; }
          .doc-type-badge { display: inline-block; background: #d97706; color: #ffffff; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.8px; margin-bottom: 4px; }
          .doc-ref { font-size: 15px; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: #0f172a; }
          .doc-date { font-size: 10px; color: #64748b; font-weight: 700; margin-top: 2px; }

          .delivery-banner { background: #fefce8; border: 2px solid #eab308; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
          .delivery-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #854d0e; letter-spacing: 0.6px; }
          .delivery-date { font-size: 15px; font-weight: 900; color: #a16207; margin-top: 2px; text-transform: capitalize; }
          .delivery-slot { font-size: 10px; font-weight: 800; color: #713f12; background: #fef08a; padding: 4px 10px; border-radius: 6px; border: 1px solid #fde047; }

          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; line-height: 1.5; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }
          tr:last-child td { border-bottom: none; }

          .haccp-box { background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 8px; padding: 10px 12px; margin-top: 14px; font-size: 10px; color: #1e3a8a; }
          .haccp-title { font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #1e40af; letter-spacing: 0.5px; }

          .footer { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center; font-size: 8.5px; color: #64748b; line-height: 1.4; }
        </style>
      </head>
      <body>

        <div class="header">
          <div class="brand-container">
            <img src="${this.COMPANY_INFO.logoUrl}" alt="${this.COMPANY_INFO.tradeName}" class="brand-logo" onerror="this.style.display='none';" />
            <div>
              <h1 class="brand-title">${this.COMPANY_INFO.tradeName}</h1>
              <span class="brand-subtitle">Espace Producteur &amp; Cueillette · Quentin Moller EI</span>
              <div class="brand-legal">
                <strong>Maraîchage &amp; Logistique Locale</strong> · SIRET : ${this.COMPANY_INFO.siret} · RCS Toulouse<br>
                ${this.COMPANY_INFO.address} · Tél : ${this.COMPANY_INFO.phone}
              </div>
            </div>
          </div>

          <div class="doc-summary">
            <span class="doc-type-badge">Fiche de Récolte</span>
            <div class="doc-ref">${docNumber}</div>
            <div class="doc-date">Réf. Parente : <strong>${parentRefNumber}</strong></div>
          </div>
        </div>

        <div class="delivery-banner">
          <div>
            <div class="delivery-title">🌾 DATE DE CUEILLETTE AUX CHAMPS &amp; DE LIVRAISON CIBLE</div>
            <div class="delivery-date">📅 ${dateFormatted}</div>
          </div>
          <div class="delivery-slot">
            ⚠️ Bacs/cagettes consignés réutilisables (Loi AGEC)
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Maraîcher Exploitant</div>
            <div class="box-content">
              <strong>${producerName}</strong><br>
              ${producerAddress}<br>
              SIRET Exploitation : <strong>${siretProducer}</strong>
            </div>
          </div>

          <div class="box">
            <div class="box-title">Destinataire Final &amp; Routage</div>
            <div class="box-content">
              Acheteur Pro : <strong>${buyerName}</strong><br>
              Lieu de Livraison : ${deliveryAddress}<br>
              Enlèvement par : <strong>Flotte Logistique ${this.COMPANY_INFO.tradeName}</strong>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">Ligne</th>
              <th style="width: 85px;">Réf SKU</th>
              <th>Désignation Produit à Récolter aux Champs</th>
              <th style="width: 120px; text-align: center;">Quantité Commandée</th>
              <th style="width: 200px;">Conditionnement Exigé</th>
              <th style="width: 80px; text-align: center;">Pointage</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHTML}
          </tbody>
        </table>

        <div class="haccp-box">
          <div class="haccp-title">📋 Traçabilité Sanitaire &amp; Numéro de Lot (HACCP)</div>
          <strong>Numéro de Lot Sanitaire Attribué :</strong> 
          <span style="font-family: monospace; font-size: 13px; font-weight: 900; color: #166534; background: white; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; margin-left: 6px;">
            ${lotNumber}
          </span>
          <div style="margin-top: 6px; font-size: 9.5px; color: #475569;">
            Conformité au Règlement CE 178/2002 (Paquet Hygiène), au Règlement CE 543/2011 (Marquage des fruits et légumes frais) et aux normes AGEC pour le réemploi des emballages consignés.
          </div>
        </div>

        <div class="footer">
          <strong>${this.COMPANY_INFO.tradeName} — ${this.COMPANY_INFO.legalName}</strong> (${this.COMPANY_INFO.legalStatus})<br>
          Document d'exploitation émis à destination du maraîcher pour préparation et mise en cagettes consignées.
        </div>

      </body>
      </html>
    `;
  }
};

/**
 * 🚚 GÉNÉRATEUR UNIQUE : PickupSlipGenerator.js
 * Emplacement : src/services/documents/PickupSlipGenerator.js
 * 
 * Principe de Responsabilité Unique (SRP) :
 * Ce module est DÉDIÉ EXCLUSIVEMENT à la génération des bons de ramassage / enlèvement (Pickup Slip).
 * Permet au chauffeur de la flotte Âne & Gorille de réaliser la collecte contradictoire chez le maraîcher.
 */

export const PickupSlipGenerator = {

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
   * Rendu propre des sous-commandes sans imbrication de template literals
   */
  renderSubOrdersHTML(subOrders) {
    if (!subOrders || subOrders.length === 0) {
      return `
        <div class="sub-block">
          <p style="text-align: center; color: #64748b;">Aucune commande spécifique associée à ce ramassage.</p>
        </div>
      `;
    }

    return subOrders.map((sub) => {
      const subId = (sub.id || '').substring(0, 8).toUpperCase();
      const buyerName = sub.buyerCompany || sub.buyerName || "Acheteur Client";
      const lotNumber = sub.lotNumber || "HACCP-OK";
      const items = sub.items || [];

      const itemRows = items.map((item) => {
        const itemName = item.name || item.title || "Produit Maraîcher";
        const itemQty = item.quantity || item.qty || 1;
        const itemUnit = item.unit || "kg";
        return `
          <tr>
            <td><strong>${itemName}</strong></td>
            <td style="text-align: center;"><strong>${itemQty} ${itemUnit}</strong></td>
            <td style="text-align: center; font-family: monospace;">[  ] Chargé</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="sub-block">
          <div class="sub-header">
            <span>Commande #${subId} — Client : <strong>${buyerName}</strong></span>
            <span style="color: #15803d; font-family: monospace;">Lot HACCP : ${lotNumber}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produit Chargé aux Champs</th>
                <th style="text-align: center; width: 100px;">Quantité</th>
                <th style="text-align: center; width: 100px;">Pointage Chargement</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  },

  /**
   * Génère le Bon de Ramassage & Enlèvement pour les tournées de collecte
   * @param {Object} pickup - Données de ramassage (producteur, sous-commandes associées)
   * @returns {string} Code HTML
   */
  generateHTML(pickup) {
    if (!pickup) return "<p>Erreur: Aucune donnée de ramassage fournie.</p>";

    const producerIdStr = (pickup.producerId || pickup.id || '0000').substring(0, 8).toUpperCase();
    const docNumber = `RAM-${producerIdStr}`;
    const reqDate = pickup.subOrders?.[0]?.selectedDate || pickup.selectedDate || "Non spécifiée";
    const formattedReqDate = reqDate !== "Non spécifiée"
      ? (reqDate.includes('-') 
          ? new Date(reqDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : reqDate)
      : reqDate;

    const subOrdersList = pickup.subOrders || (pickup.items ? [pickup] : []);
    const totalSubOrders = subOrdersList.length;
    const phoneHTML = pickup.producerPhone ? 'Tél : <strong>' + pickup.producerPhone + '</strong>' : '';

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Ramassage - ${docNumber}</title>
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
          .doc-ram { font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }
          .doc-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-top: 4px; }

          .delivery-banner { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 10px 14px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .delivery-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #15803d; letter-spacing: 0.5px; }
          .delivery-date { font-size: 15px; font-weight: 900; color: #166534; margin-top: 2px; text-transform: capitalize; }
          .delivery-slot { font-size: 10px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 3px 8px; border-radius: 4px; border: 1px solid #86efac; }

          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; line-height: 1.4; }

          .sub-block { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 12px; background: #f8fafc; }
          .sub-header { display: flex; justify-content: space-between; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }

          table { width: 100%; border-collapse: collapse; background: #ffffff; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 5px 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
          td { border-bottom: 1px solid #f1f5f9; padding: 6px 8px; font-size: 10.5px; }

          .signature-grid { display: flex; justify-content: space-between; margin-top: 20px; gap: 15px; }
          .signature-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; height: 85px; font-size: 10px; background: #f8fafc; }

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
                Flotte de Collecte Logistique · ${this.COMPANY_INFO.drealLicense}<br>
                SIRET : ${this.COMPANY_INFO.siret} · ${this.COMPANY_INFO.address}
              </div>
            </div>
          </div>

          <div class="doc-type">
            <div class="doc-title">Bon de Ramassage</div>
            <div class="doc-ram">${docNumber}</div>
            <div class="doc-badge">Logistique Collecte</div><br>
            <small style="color: #64748b; font-weight: 700; display: inline-block; margin-top: 4px;">Émis le : ${new Date().toLocaleDateString("fr-FR")}</small>
          </div>
        </div>

        <div class="delivery-banner">
          <div>
            <div class="delivery-title">🚚 HALTE MARAÎCHÈRE &amp; DATE DE TOURNEE MATINALE</div>
            <div class="delivery-date">📅 ${formattedReqDate}</div>
          </div>
          <div class="delivery-slot">
            ${totalSubOrders} colis/commande(s) à charger
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Point de Collecte (Maraîcher Exploitant)</div>
            <div class="box-content">
              <strong>${pickup.producerName || "Exploitation Agricole Locale"}</strong><br>
              ${pickup.producerAddress || "Adresse de l'exploitation agricole"}<br>
              ${phoneHTML}
            </div>
          </div>

          <div class="box">
            <div class="box-title">Transporteur &amp; Matériel</div>
            <div class="box-content">
              Opérateur : <strong>${this.COMPANY_INFO.tradeName} Logistique</strong><br>
              Chauffeur-Livreur : <em>Tournée Matinale (-3,5t)</em><br>
              Contrôle Bacs Consignés : <strong>Pointage Contradictoire</strong>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 8px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #0f766e;">
          📦 Colis &amp; Cagettes sous Pointage Contradictoire :
        </div>

        ${this.renderSubOrdersHTML(subOrdersList)}

        <div class="signature-grid">
          <div class="signature-box">
            <strong style="color: #0f766e;">Émargement Maraîcher (Remise des colis) :</strong><br><br>
            <em style="color: #64748b;">Signature &amp; Date de remise</em>
          </div>
          <div class="signature-box">
            <strong style="color: #0f766e;">Émargement Chauffeur ${this.COMPANY_INFO.tradeName} :</strong><br><br>
            <em style="color: #64748b;">Prise en charge camion et contrôle chaîne du froid</em>
          </div>
        </div>

        <div class="footer">
          Document d'enlèvement d'exploitation · <strong>${this.COMPANY_INFO.tradeName}</strong> (${this.COMPANY_INFO.legalName}) · SIRET : ${this.COMPANY_INFO.siret}.
        </div>

      </body>
      </html>
    `;
  }
};
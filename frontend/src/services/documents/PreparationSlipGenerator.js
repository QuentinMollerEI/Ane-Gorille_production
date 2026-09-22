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
   * Génère la Fiche de Récolte & Bon de Préparation (A4 imprimable)
   * @param {Object} subOrder - La sous-commande producteur
   * @param {Object|null} parentOrder - La commande globale parente
   * @returns {string} Code HTML
   */
  generateHTML(subOrder, parentOrder = null) {
    if (!subOrder) return "<p>Erreur: Aucune sous-commande fournie pour la préparation.</p>";

    const selectedDate = subOrder.selectedDate || parentOrder?.selectedDate || parentOrder?.deliveryDate || parentOrder?.deliveryDetails?.selectedDate || subOrder.deliveryDate || "Non spécifiée";
    const dateFormatted = selectedDate !== "Non spécifiée" 
      ? (selectedDate.includes('-') 
          ? new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
          : selectedDate)
      : "À définir";

    const docNumber = subOrder.id ? `PREP-${subOrder.id.substring(0, 8).toUpperCase()}` : "PREP-0001";
    const buyerName = subOrder.buyerCompany || subOrder.buyerName || parentOrder?.buyerCompany || parentOrder?.buyerName || "Acheteur Client Pro";
    const deliveryAddress = subOrder.deliveryAddress || parentOrder?.deliveryAddress || "Adresse de livraison non renseignée";

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Récolte - ${docNumber}</title>
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
          .doc-prep { font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px; }
          .doc-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-top: 4px; }

          .delivery-banner { background: #fefce8; border: 2px solid #eab308; border-radius: 8px; padding: 10px 14px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .delivery-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #854d0e; letter-spacing: 0.5px; }
          .delivery-date { font-size: 15px; font-weight: 900; color: #a16207; margin-top: 2px; text-transform: capitalize; }
          .delivery-slot { font-size: 10px; font-weight: 700; color: #713f12; text-align: right; }

          .grid { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
          .box { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .box-content { font-size: 11px; color: #1e293b; line-height: 1.4; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #0f766e; color: #ffffff; text-align: left; padding: 6px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155; }
          .col-qty { width: 110px; text-align: center; font-size: 14px; font-weight: 900; color: #166534; font-family: monospace; }
          .col-pack { width: 220px; color: #475569; font-size: 10px; }
          .col-check { width: 70px; text-align: center; font-weight: 800; }

          .haccp-box { background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 6px; padding: 10px 12px; margin-top: 15px; font-size: 10px; color: #1e3a8a; }
          .haccp-title { font-weight: 800; text-transform: uppercase; margin-bottom: 4px; color: #1e40af; letter-spacing: 0.5px; }

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
                Espace Producteur · SIRET : ${this.COMPANY_INFO.siret} · ${this.COMPANY_INFO.rcs}<br>
                ${this.COMPANY_INFO.address}
              </div>
            </div>
          </div>

          <div class="doc-type">
            <div class="doc-title">Fiche de Récolte</div>
            <div class="doc-prep">${docNumber}</div>
            <div class="doc-badge">Espace Maraîcher</div><br>
            <small style="color: #64748b; font-weight: 700; display: inline-block; margin-top: 4px;">Émis le : ${new Date().toLocaleDateString("fr-FR")}</small>
          </div>
        </div>

        <div class="delivery-banner">
          <div>
            <div class="delivery-title">🌾 DATE DE CUEILLETTE AUX CHAMPS &amp; DE LIVRAISON CIBLE</div>
            <div class="delivery-date">📅 ${dateFormatted}</div>
          </div>
          <div class="delivery-slot">
            ⚠️ Mettre en bacs/cagettes consignés réutilisables (Loi AGEC)
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Maraîcher Exploitant</div>
            <div class="box-content">
              <strong>${subOrder.producerName || "Exploitation Agricole Partenaire"}</strong><br>
              ${subOrder.producerAddress || subOrder.producerCity || "Adresse de l'exploitation"}<br>
              SIRET : <strong>${subOrder.siretProducer || "-"}</strong>
            </div>
          </div>

          <div class="box">
            <div class="box-title">Destinataire Final &amp; Enlèvement Flotte</div>
            <div class="box-content">
              Destinataire : <strong>${buyerName}</strong><br>
              Livraison : ${deliveryAddress}<br>
              Enlèvement par : <strong>Flotte Logistique ${this.COMPANY_INFO.tradeName}</strong>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation Produit à Récolter</th>
              <th style="text-align: center;">Quantité Commandée</th>
              <th>Conditionnement Exigé</th>
              <th style="text-align: center;">Contrôle Récolte</th>
            </tr>
          </thead>
          <tbody>
            ${(subOrder.items || []).map(item => `
              <tr>
                <td>
                  <strong>\${item.name || item.title || "Légume / Produit Frais"}</strong>
                 ${item.isBio ? ' <span style="background:#dcfce7; color:#166534; font-size:9px; font-weight:800; padding:1px 4px; border-radius:3px;">BIO</span>' : ''}
                </td>
                <td class="col-qty">\\({item.quantity || item.qty} \\){item.unit || 'kg'}</td>
                <td class="col-pack">Cagette Plastique Pro Consignée (HACCP)</td>
                <td class="col-check">[  ] Récolté</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="haccp-box">
          <div class="haccp-title">📋 Traçabilité Sanitaire &amp; Numéro de Lot (HACCP)</div>
          <strong>Numéro de Lot Sanitaire Attribué :</strong> 
          <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #166534; background: white; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">
            ${subOrder.lotNumber || subOrder.batchNumber || 'LOT-' + new Date().toISOString().slice(0,10).replace(/-/g,'')}
          </span><br>
          <small style="margin-top: 4px; display: block; color: #475569;">Conformité au Règlement CE 178/2002 (Paquet Hygiène) et au Règlement CE 543/2011 (Marquage des fruits et légumes frais).</small>
        </div>

        <div class="footer">
          Document d'exploitation émis par <strong>${this.COMPANY_INFO.tradeName}</strong> (${this.COMPANY_INFO.legalName}) · Transporteur sous licence DREAL.
        </div>

      </body>
      </html>
    `;
  }
};
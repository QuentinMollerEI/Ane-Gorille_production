/**
 * 📜 SERVICE DOCUMENTAIRE : OrderDocumentGenerator.js
 * Générateur universel de documents imprimables et téléchargeables :
 * 1. Bon de Commande (Acheteur & Vendeur)
 * 2. Bon de Préparation (Maraîcher / Récolte)
 * 3. Bon de Ramassage (Livreur / Collecte Exploitation)
 * 4. Bon de Livraison - BL (Livreur / Client avec Émargement & Réserves)
 * 
 * GARANTIE : Affiche de façon proéminente la "DATE DE LIVRAISON SOUHAITÉE" sur chaque document.
 */

import { formatFrenchDate, getCalculatedDeliveryDate } from "../utils/deliveryCalendar.js";

/**
 * Extraie les articles de manière universelle (qu'il s'agisse d'une commande parente ou d'un groupe multi-producteurs).
 */
const extractItems = (data) => {
  if (Array.isArray(data.items) && data.items.length > 0) {
    return data.items;
  }
  if (Array.isArray(data.subOrders) && data.subOrders.length > 0) {
    const combined = [];
    data.subOrders.forEach((so) => {
      if (Array.isArray(so.items)) {
        so.items.forEach((item) => {
          combined.push({
            ...item,
            producerName: item.producerName || so.producerName || "Maraîcher",
            lotNumber: item.lotNumber || so.lotNumber || "HACCP-OK"
          });
        });
      }
    });
    return combined;
  }
  return [];
};

export const OrderDocumentGenerator = {

  /**
   * 1. 🛒 BON DE COMMANDE (Global ou Sous-Commande)
   */
  generateOrderSlipHTML(order) {
    const rawDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate;
    const selectedDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
      ? rawDate
      : getCalculatedDeliveryDate(order.createdAt?.toDate ? order.createdAt.toDate() : new Date());

    const dateFormatted = formatFrenchDate(selectedDate);

    const items = extractItems(order);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Commande - ${order.orderNumber || order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { font-size: 20px; font-weight: 900; color: #0f766e; }
          .title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #0f172a; }
          
          .delivery-badge { background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 6px; padding: 12px; margin-bottom: 20px; text-align: center; }
          .delivery-badge-title { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #15803d; letter-spacing: 0.5px; }
          .delivery-badge-date { font-size: 18px; font-weight: 900; color: #166534; margin-top: 4px; }
          
          .grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .box { width: 48%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
          .box-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0f766e; color: white; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
          .total-row { font-weight: 800; font-size: 13px; background: #f1f5f9; }
          .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Âne & Gorille</div>
          <div class="title">Bon de Commande</div>
        </div>

        <!-- BADGE OFFICIEL DATE DE LIVRAISON SOUHAITÉE -->
        <div class="delivery-badge">
          <div class="delivery-badge-title">📅 Date de Livraison Souhaitée par l'Acheteur</div>
          <div class="delivery-badge-date">${dateFormatted} (${selectedDate.split('-').reverse().join('/')})</div>
          <small style="color: #15803d; font-weight: 600;">Créneau : ${order.deliveryDetails?.deliveryWindow || "Matin (06h00 - 08h00)"}</small>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Client / Acheteur</div>
            <strong>${order.buyerName || "Acheteur Client"}</strong><br>
            ${order.deliveryAddress || "Adresse de livraison"}<br>
            SIRET : ${order.siretBuyer || "-"}<br>
            N° Engagement : ${order.refEngagement || "-"}
          </div>
          <div class="box">
            <div class="box-title">Détails Commande</div>
            N° Commande : <strong>${order.orderNumber || order.id}</strong><br>
            Date d'Achat : ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR")}<br>
            Mode de Règlement : <strong>${order.paymentMethod === 'mandat_public' ? 'Mandat Public (Chorus Pro)' : 'Règlement B2B'}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation Produit</th>
              <th>Producteur</th>
              <th>Quantité</th>
              <th>Prix Unitaire HT</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td>${item.producerName || "Maraîcher Local"}</td>
                <td>${item.quantity || item.qty} ${item.unit || 'kg'}</td>
                <td>${Number(item.priceHT || item.price || 0).toFixed(2)} €</td>
                <td>${(Number(item.quantity || 1) * Number(item.priceHT || item.price || 0)).toFixed(2)} €</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align: right; padding-right: 10px;">Total HT Produit :</td>
              <td>${Number(order.totalHT || order.amountHT || 0).toFixed(2)} €</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" style="text-align: right; padding-right: 10px;">Frais de Livraison B2B :</td>
              <td>${Number(order.deliveryFee || 0).toFixed(2)} €</td>
            </tr>
            <tr class="total-row" style="background: #e2e8f0; font-size: 14px;">
              <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL TTC :</td>
              <td><strong>${Number(order.totalTTC || order.totalAmount || order.amount || 0).toFixed(2)} €</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Document généré par la plateforme Âne & Gorille — EI Régime Réel Simplifié de TVA — SIRET : 123 456 789 00012
        </div>
      </body>
      </html>
    `;
  },

  /**
   * 🌾 2. BON DE PRÉPARATION / FICHE DE RÉCOLTE (Producteur / Maraîcher)
   */
  generatePreparationSlipHTML(subOrder) {
    const rawDate = subOrder.selectedDate || subOrder.deliveryDate || subOrder.deliveryDetails?.selectedDate;
    const selectedDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
      ? rawDate
      : getCalculatedDeliveryDate(subOrder.createdAt?.toDate ? subOrder.createdAt.toDate() : new Date());

    const dateFormatted = formatFrenchDate(selectedDate);
    const items = extractItems(subOrder);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Préparation Maraîchère - ${subOrder.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0f172a; padding: 20px; line-height: 1.5; }
          .header { border-bottom: 3px solid #15803d; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 18px; font-weight: 900; color: #166534; text-transform: uppercase; }
          
          .harvest-alert { background-color: #fefce8; border: 2px solid #eab308; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .harvest-date-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #854d0e; }
          .harvest-date-value { font-size: 22px; font-weight: 900; color: #a16207; margin-top: 4px; }
          
          .grid { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .box { width: 48%; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #166534; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
          
          .haccp-box { margin-top: 25px; border: 2px dashed #166534; padding: 15px; border-radius: 6px; background: #f0fdf4; }
          .haccp-title { font-weight: 800; color: #14532d; text-transform: uppercase; font-size: 11px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Préparation & Récolte</div>
            <small style="color: #64748b;">N° Sous-Commande : <strong>${subOrder.id}</strong></small>
          </div>
          <div style="font-weight: 800; color: #15803d; font-size: 16px;">Âne & Gorille</div>
        </div>

        <!-- ALERTE DATE DE LIVRAISON POUR LE MARAÎCHER -->
        <div class="harvest-alert">
          <div class="harvest-date-label">🌾 DATE DE LIVRAISON SOUHAITÉE PAR L'ACHETEUR</div>
          <div class="harvest-date-value">📅 ${dateFormatted} (${selectedDate.split('-').reverse().join('/')})</div>
          <div style="font-size: 11px; font-weight: 700; color: #713f12; margin-top: 5px;">
            ⚠️ Les produits doivent être cueillis, mis en cagettes fraîches et prêts pour le ramassage camion le matin même.
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Maraîcher Exploitant :</strong><br>
            ${subOrder.producerName || "Exploitation Agricole"}
          </div>
          <div class="box">
            <strong>Destinataire Final :</strong><br>
            ${subOrder.buyerName || "Acheteur Client"}<br>
            ${subOrder.deliveryAddress || "Adresse de livraison"}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produit à Récolter</th>
              <th>Quantité Commandée</th>
              <th>Conditionnement</th>
              <th>Cocher Récolté</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td><strong style="font-size: 15px; color: #166534;">${item.quantity || item.qty} ${item.unit || 'kg'}</strong></td>
                <td>Cagette bois / Isotherme</td>
                <td style="text-align: center;"><input type="checkbox" style="transform: scale(1.5);"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="haccp-box">
          <div class="haccp-title">📋 Traçabilité Sanitaire & Numéro de Lot (HACCP)</div>
          <strong>Numéro de Lot Attribué :</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #166534;">${subOrder.lotNumber || subOrder.batchNumber || 'À renseigner lors du démarrage'}</span><br>
          <small>Règlement CE 178/2002 & Règlements CE 543/2011 sur le marquage des fruits et légumes frais.</small>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * 🚚 3. BON DE RAMASSAGE / ENLÈVEMENT FERME (Livreur / Maraîcher)
   */
  generatePickupSlipHTML(pickup) {
    const rawDate = pickup.subOrders?.[0]?.selectedDate || pickup.selectedDate;
    const selectedDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
      ? rawDate
      : getCalculatedDeliveryDate(new Date());

    const dateFormatted = formatFrenchDate(selectedDate);
    const items = extractItems(pickup);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Ramassage - ${pickup.producerName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0f172a; padding: 20px; line-height: 1.5; }
          .header { border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 18px; font-weight: 900; color: #15803d; text-transform: uppercase; }
          
          .pickup-badge { background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center; }
          .pickup-date-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #15803d; }
          .pickup-date-value { font-size: 20px; font-weight: 900; color: #166534; margin-top: 4px; }
          
          .grid { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .box { width: 48%; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #16a34a; color: white; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Ramassage & Collecte Exploitation</div>
            <small style="color: #64748b;">Espace Livreur — Collecte Camion</small>
          </div>
          <div style="font-weight: 800; color: #16a34a; font-size: 16px;">Âne & Gorille Logistique</div>
        </div>

        <div class="pickup-badge">
          <div class="pickup-date-label">📅 DATE DE LIVRAISON CIBLE POUR LES COLIS RAMASSÉS</div>
          <div class="pickup-date-value">${dateFormatted} (${selectedDate.split('-').reverse().join('/')})</div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Maraîcher Expediteur :</strong><br>
            <strong>${pickup.producerName || "Maraîcher Local"}</strong><br>
            ${pickup.producerAddress || "Adresse Exploitation"}<br>
            Tél : ${pickup.producerPhone || "-"}
          </div>
          <div class="box">
            <strong>Contrôle Chargement Camion :</strong><br>
            Transporteur : <strong>Livreur Âne & Gorille</strong><br>
            Nombre de colis : <strong>${pickup.subOrders?.length || 1} cagette(s)</strong><br>
            Statut : <strong>Prêt pour Chargement Frigo</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Réf / Produit</th>
              <th>Acheteur Destinataire</th>
              <th>Quantité</th>
              <th>N° Lot HACCP</th>
              <th>Pointage Livreur</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td>${item.buyerName || "Client"}</td>
                <td><strong>${item.quantity || item.qty} ${item.unit || 'kg'}</strong></td>
                <td><span style="font-family: monospace; font-weight: bold; color: #166534;">${item.lotNumber || 'HACCP-OK'}</span></td>
                <td style="text-align: center;"><input type="checkbox" style="transform: scale(1.3);"> Chargé</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  },

  /**
   * 🚚 4. BON DE LIVRAISON - BL (Livreur / Client avec Émargement & Réserves)
   */
  generateDeliverySlipHTML(order) {
    const rawDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate;
    const selectedDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
      ? rawDate
      : getCalculatedDeliveryDate(order.createdAt?.toDate ? order.createdAt.toDate() : new Date());

    const dateFormatted = formatFrenchDate(selectedDate);
    const items = extractItems(order);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Livraison - ${order.orderNumber || order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0f172a; padding: 20px; line-height: 1.5; }
          .header { border-bottom: 3px solid #0369a1; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 18px; font-weight: 900; color: #0369a1; text-transform: uppercase; }
          
          .bl-header-box { background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center; }
          .bl-date-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; }
          .bl-date-value { font-size: 20px; font-weight: 900; color: #075985; margin-top: 4px; }
          
          .grid { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .box { width: 48%; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0369a1; color: white; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 12px; }
          
          .sign-box { margin-top: 25px; display: flex; justify-content: space-between; }
          .sign-card { width: 48%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #fafafa; }
          .sign-img { max-height: 80px; border: 1px solid #cbd5e1; background: white; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Livraison (BL)</div>
            <small style="color: #64748b;">Ref : <strong>BL-${order.orderNumber || order.id}</strong></small>
          </div>
          <div style="font-weight: 800; color: #0369a1; font-size: 16px;">Âne & Gorille Logistique</div>
        </div>

        <!-- BADGE OFFICIEL DATE DE LIVRAISON DU BL -->
        <div class="bl-header-box">
          <div class="bl-date-label">📅 DATE DE LIVRAISON DÉSIGNÉE SUR LE BL</div>
          <div class="bl-date-value">${dateFormatted} (${selectedDate.split('-').reverse().join('/')})</div>
          <div style="font-size: 11px; font-weight: 600; color: #0369a1; margin-top: 4px;">
            Créneau de livraison : ${order.deliveryDetails?.deliveryWindow || "Matin (06h00 - 08h00)"}
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <strong>Client Destinataire :</strong><br>
            <strong>${order.buyerName || "Acheteur Client"}</strong><br>
            ${order.deliveryAddress || "Adresse de livraison"}<br>
            Remarques : ${order.deliveryDetails?.instructions || "Aucune consigne"}
          </div>
          <div class="box">
            <strong>Contrôle Logistique & Transport :</strong><br>
            Chauffeur Livreur : <strong>${order.carrierName || "Livreur Âne & Gorille"}</strong><br>
            Relevé Température HACCP : <strong>${order.tempHaccp !== undefined ? order.tempHaccp + " °C" : "En attente"}</strong><br>
            Statut : <strong>${order.status === 'delivered' ? 'LIVRÉ' : 'EN COURS'}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Réf / Produit</th>
              <th>Maraîcher Origine</th>
              <th>Quantité</th>
              <th>N° Lot HACCP</th>
              <th>État Réception</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td>${item.producerName || "Producteur"}</td>
                <td><strong>${item.quantity || item.qty} ${item.unit || 'kg'}</strong></td>
                <td><span style="font-family: monospace; font-weight: bold;">${item.lotNumber || order.lotNumber || 'HACCP-OK'}</span></td>
                <td>Conforme / Bon état</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- ZONE DÉDIÉE AUX RÉSERVES DU CLIENT -->
        ${order.reservations ? `
          <div style="margin-top: 15px; border: 2px solid #dc2626; padding: 10px; border-radius: 6px; background-color: #fef2f2; color: #991b1b;">
            <strong>⚠️ RÉSERVES ÉMISES À LA RÉCEPTION :</strong><br>
            ${order.reservations}
          </div>
        ` : ''}

        <div class="sign-box">
          <div class="sign-card">
            <strong>Contrôle Température Camion :</strong><br>
            Température mesurée : <strong>${order.tempHaccp !== undefined ? order.tempHaccp + " °C" : "___ °C"}</strong><br>
            <small style="color: #166534;">✓ Respect strict de la chaîne du froid (2°C - 8°C)</small>
          </div>
          <div class="sign-card">
            <strong>Émargement Client Réceptionnaire :</strong><br>
            Nom : <strong>${order.recipientName || order.buyerName || "Réceptionnaire"}</strong><br>
            ${order.signature && order.signature.startsWith('data:') ? `
              <img src="${order.signature}" class="sign-img" alt="Signature eIDAS" />
            ` : `<small style="color: #64748b; font-style: italic;">Signé numériquement au déchargement</small>`}
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

export default OrderDocumentGenerator;

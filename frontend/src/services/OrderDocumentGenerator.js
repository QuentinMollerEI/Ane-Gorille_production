import { OrderSlipGenerator } from "./documents/OrderSlipGenerator";

/**
 * 📜 FAÇADE DOCUMENTAIRE : OrderDocumentGenerator.js
 * Emplacement : src/services/OrderDocumentGenerator.js
 * Façade unifiée facilitant la transition vers les générateurs SRP spécialisés.
 */

export const OrderDocumentGenerator = {

  generateOrderSlipHTML(order) {
    if (OrderSlipGenerator && typeof OrderSlipGenerator.generateHTML === "function") {
      return OrderSlipGenerator.generateHTML(order);
    }
    return "<p>Générateur de bon de commande indisponible.</p>";
  },

  generatePreparationSlipHTML(subOrder, parentOrder = null) {
    const selectedDate = subOrder?.selectedDate || parentOrder?.selectedDate || parentOrder?.deliveryDate || parentOrder?.deliveryDetails?.selectedDate || subOrder?.deliveryDate || "Non spécifiée";
    const dateFormatted = selectedDate !== "Non spécifiée" 
      ? new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
      : "À définir";

    const buyerName = subOrder?.buyerName || parentOrder?.buyerName || "Acheteur Client";
    const deliveryAddress = subOrder?.deliveryAddress || parentOrder?.deliveryAddress || "Adresse de livraison";

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Préparation - ${subOrder?.id || 'SUB'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; padding: 15px; }
          .header { border-bottom: 3px solid #15803d; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 18px; font-weight: 900; color: #166534; text-transform: uppercase; }
          .alert { background: #fefce8; border: 2px solid #eab308; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #166534; color: white; padding: 8px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Préparation & Récolte</div>
            <small>Sous-commande N° : <strong>${subOrder?.id}</strong></small>
          </div>
          <div style="font-weight: 900; color: #15803d;">Âne & Gorille (Quentin Moller EI)</div>
        </div>

        <div class="alert">
          <strong style="color: #854d0e;">🌾 DATE DE LIVRAISON CIBLE : ${dateFormatted} (${selectedDate})</strong>
        </div>

        <p><strong>Producteur :</strong> ${subOrder?.producerName || 'Maraîcher'}<br>
        <strong>Client :</strong> ${buyerName} (${deliveryAddress})</p>

        <table>
          <thead>
            <tr>
              <th>Produit à Récolter</th>
              <th>Quantité</th>
              <th>Pointage Récolte</th>
            </tr>
          </thead>
          <tbody>
            ${(subOrder?.items || []).map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td><strong>${item.quantity || item.qty} ${item.unit || 'kg'}</strong></td>
                <td>[  ] Récolté / Cagette OK</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  },

  generateDeliverySlipHTML(order) {
    const selectedDate = order?.selectedDate || order?.deliveryDate || order?.deliveryDetails?.selectedDate || "Non spécifiée";
    const dateFormatted = selectedDate !== "Non spécifiée" 
      ? new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
      : "À définir";

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Livraison - ${order?.orderNumber || order?.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; padding: 15px; }
          .header { border-bottom: 3px solid #0369a1; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
          .title { font-size: 18px; font-weight: 900; color: #0369a1; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0369a1; color: white; padding: 8px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Bon de Livraison (BL)</div>
            <small>Réf BL : <strong>BL-${(order?.id || '').substring(0, 8).toUpperCase()}</strong></small>
          </div>
          <div style="font-weight: 900; color: #0369a1;">Âne & Gorille (Quentin Moller EI)</div>
        </div>

        <p><strong>Destinataire :</strong> ${order?.buyerName || 'Acheteur Client'}<br>
        <strong>Adresse :</strong> ${order?.deliveryAddress || 'Adresse de livraison'}<br>
        <strong>Date de Livraison :</strong> ${dateFormatted} (${selectedDate})<br>
        <strong>Contrôle Température HACCP :</strong> ${order?.tempHaccp ? order.tempHaccp + '°C' : '4.5°C'}</p>

        <table>
          <thead>
            <tr>
              <th>Désignation Article</th>
              <th>Producteur</th>
              <th>Quantité Livrée</th>
            </tr>
          </thead>
          <tbody>
            ${(order?.items || []).map(item => `
              <tr>
                <td><strong>${item.name || item.title}</strong></td>
                <td>${item.producerName || 'Maraîcher'}</td>
                <td><strong>${item.quantity || item.qty} ${item.unit || 'kg'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  },

  generatePickupSlipHTML(pickup) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Enlèvement - ${pickup?.producerName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header { border-bottom: 3px solid #0f766e; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Bon de Enlèvement Maraîcher</h2>
          <p>Exploitation : <strong>${pickup?.producerName}</strong></p>
        </div>
      </body>
      </html>
    `;
  }
};

export default OrderDocumentGenerator;

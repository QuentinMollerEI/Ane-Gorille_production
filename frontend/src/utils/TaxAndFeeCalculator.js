/**
 * 🧮 CALCULATEUR FINANCIER & FISCAL CERTIFIÉ (TaxAndFeeCalculator.js)
 * Emplacement : frontend/src/utils/TaxAndFeeCalculator.js
 * 
 * Responsabilité Unique (SRP) :
 * Centraliser l'ensemble des règles de calculs financiers, de TVA décomposée
 * et de frais de livraison B2B dégressifs pour la plateforme Âne & Gorille.
 */

export const TaxAndFeeCalculator = {
  /**
   * Taux de TVA officiels
   */
  VAT_RATES: {
    FOOD: 0.055,      // TVA 5.5 % Produits alimentaires (Fruits & Légumes)
    TRANSPORT: 0.20,  // TVA 20.0 % Transport & Logistique
    COMMISSION: 0.20  // TVA 20.0 % Commission Marketplace
  },

  /**
   * Calcule les frais de port B2B HT selon la grille dégressive officielle
   * - < 150 € HT  : 15.00 € HT
   * - 150 à 299 € HT : 8.00 € HT
   * - >= 300 € HT : FRANCO DE PORT (0.00 €)
   * @param {number} totalItemsHT Total HT des produits du panier
   * @returns {number} Frais de livraison HT
   */
  calculateShippingFeeHT(totalItemsHT = 0) {
    const total = Number(totalItemsHT) || 0;
    if (total >= 300) return 0;
    if (total >= 150) return 8;
    return 15;
  },

  /**
   * Calcule la ventilation complète d'un panier
   * @param {Array} cartItems Liste des articles [{ priceHT, quantity, vatRate, producerId, producerName, ... }]
   * @returns {Object} Synthèse complète certifiée
   */
  computeOrderTotals(cartItems = []) {
    if (!Array.isArray(cartItems)) cartItems = [];

    let itemsTotalHT = 0;
    let itemsVAT = 0;
    const producersBreakdown = {};

    // 1. Calculs par produit et regroupement par maraîcher
    cartItems.forEach(item => {
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const priceHT = Number(item.priceHT ?? item.price ?? 0);
      const vatRate = Number(item.vatRate ?? 5.5) / 100;

      const lineHT = priceHT * qty;
      const lineVAT = lineHT * vatRate;

      itemsTotalHT += lineHT;
      itemsVAT += lineVAT;

      // Groupement par Maraîcher pour sub_orders
      const pId = item.producerId || "PROD_DEFAULT";
      if (!producersBreakdown[pId]) {
        producersBreakdown[pId] = {
          producerId: pId,
          producerName: item.producerName || "Maraîcher",
          stripeAccountId: item.producerStripeAccountId || item.stripeAccountId || null,
          itemsHT: 0,
          vatAmount: 0,
          supplierShare82HT: 0,
          commission12HT: 0,
          totalToPayTTC: 0
        };
      }

      producersBreakdown[pId].itemsHT += lineHT;
      producersBreakdown[pId].vatAmount += lineVAT;
    });

    // 2. Calculs des parts maraîcher (82%) et commission (12%)
    Object.keys(producersBreakdown).forEach(pId => {
      const p = producersBreakdown[pId];
      p.supplierShare82HT = p.itemsHT * 0.82;
      p.commission12HT = p.itemsHT * 0.12;
      p.totalToPayTTC = p.itemsHT + p.vatAmount;
    });

    // 3. Calculs Frais de Port & TVA Transport (20%)
    const shippingFeeHT = this.calculateShippingFeeHT(itemsTotalHT);
    const shippingVAT = shippingFeeHT * this.VAT_RATES.TRANSPORT;
    const shippingTotalTTC = shippingFeeHT + shippingVAT;

    // 4. Totaux Généraux de la Commande
    const itemsTotalTTC = itemsTotalHT + itemsVAT;
    const grandTotalHT = itemsTotalHT + shippingFeeHT;
    const grandTotalVAT = itemsVAT + shippingVAT;
    const grandTotalTTC = grandTotalHT + grandTotalVAT;

    return {
      itemsTotalHT: Number(itemsTotalHT.toFixed(2)),
      itemsVAT: Number(itemsVAT.toFixed(2)),
      itemsTotalTTC: Number(itemsTotalTTC.toFixed(2)),
      
      shippingFeeHT: Number(shippingFeeHT.toFixed(2)),
      shippingVAT: Number(shippingVAT.toFixed(2)),
      shippingTotalTTC: Number(shippingTotalTTC.toFixed(2)),

      grandTotalHT: Number(grandTotalHT.toFixed(2)),
      grandTotalVAT: Number(grandTotalVAT.toFixed(2)),
      grandTotalTTC: Number(grandTotalTTC.toFixed(2)),

      producersBreakdown
    };
  }
};

export default TaxAndFeeCalculator;

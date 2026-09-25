export const TaxAndFeeCalculator = {
  calculateShippingFeeHT(itemsTotalHT) {
    const total = Number(itemsTotalHT) || 0;
    if (total >= 300) return 0;
    if (total >= 150) return 8;
    return 15;
  },

  calculateCartTotals(cartItems = []) {
    let itemsTotalHT = 0;
    let itemsVAT = 0;
    let totalCommissionHT = 0;

    cartItems.forEach((item) => {
      const priceHT = Number(item.priceHT ?? item.price ?? 0);
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const vatRate = Number(item.vatRate ?? (item.category === "artisanat" ? 20 : 5.5));

      const lineHT = priceHT * qty;
      const lineVAT = lineHT * (vatRate / 100);
      const lineCommission = lineHT * 0.12;

      itemsTotalHT += lineHT;
      itemsVAT += lineVAT;
      totalCommissionHT += lineCommission;
    });

    const shippingFeeHT = this.calculateShippingFeeHT(itemsTotalHT);
    const shippingVAT = shippingFeeHT * 0.20;
    const grandTotalTTC = itemsTotalHT + itemsVAT + shippingFeeHT + shippingVAT;
    const netProducersHT = itemsTotalHT - totalCommissionHT;

    return {
      itemsTotalHT: Number(itemsTotalHT.toFixed(2)),
      itemsVAT: Number(itemsVAT.toFixed(2)),
      shippingFeeHT: Number(shippingFeeHT.toFixed(2)),
      shippingVAT: Number(shippingVAT.toFixed(2)),
      totalCommissionHT: Number(totalCommissionHT.toFixed(2)),
      netProducersHT: Number(netProducersHT.toFixed(2)),
      grandTotalTTC: Number(grandTotalTTC.toFixed(2))
    };
  }
};

export default TaxAndFeeCalculator;
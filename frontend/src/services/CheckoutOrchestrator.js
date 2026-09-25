import { db } from "../config/firebase.js";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import TaxAndFeeCalculator from "../utils/TaxAndFeeCalculator.js";

export const CheckoutOrchestrator = {
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile || !buyerProfile.uid) {
      throw new Error("Profil acheteur non authentifié.");
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Le panier est vide.");
    }

    const totals = TaxAndFeeCalculator.calculateCartTotals(cartItems);
    const orderId = `PO-CMD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const subOrders = {};
    cartItems.forEach((item) => {
      const pId = item.producerId || "fournisseur_general";
      if (!subOrders[pId]) {
        subOrders[pId] = {
          producerId: pId,
          producerName: item.producerName || "Producteur Partenaire",
          stripeAccountId: item.stripeAccountId || null,
          items: [],
          totalHT: 0,
          totalVAT: 0,
          commissionHT: 0
        };
      }

      const itemHT = (Number(item.priceHT) || 0) * (Number(item.quantity) || 1);
      const itemVATRate = Number(item.vatRate) || 5.5;
      const itemVAT = itemHT * (itemVATRate / 100);

      subOrders[pId].items.push({
        id: item.id,
        name: item.name || item.title,
        priceHT: item.priceHT,
        vatRate: itemVATRate,
        quantity: item.quantity || 1,
        unit: item.unit || "kg",
        batchNumber: item.batchNumber || "L-2026-001"
      });
      subOrders[pId].totalHT += itemHT;
      subOrders[pId].totalVAT += itemVAT;
      subOrders[pId].commissionHT += itemHT * 0.12;
    });

    await runTransaction(db, async (transaction) => {
      // PHASE 1 : READS
      const stockUpdates = [];

      for (const item of cartItems) {
        if (item.id) {
          const productRef = doc(db, "products", item.id);
          const productSnap = await transaction.get(productRef);

          if (productSnap.exists()) {
            const data = productSnap.data();

            // 💡 Détection universelle multi-champs du stock (stock, quantity, stockQuantity)
            const rawStock = data.stock ?? data.quantity ?? data.stockQuantity ?? data.stock_quantity;
            const currentStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : 999;
            const requestedQty = Number(item.quantity) || 1;

            if (currentStock < requestedQty) {
              throw new Error(
                `Stock insuffisant pour "${item.name || item.title}" (${currentStock} disponible(s)).`
              );
            }

            const stockField = (data.stock !== undefined) ? "stock" :
                               (data.quantity !== undefined) ? "quantity" :
                               (data.stockQuantity !== undefined) ? "stockQuantity" : "stock";

            stockUpdates.push({
              ref: productRef,
              field: stockField,
              newStock: Math.max(0, currentStock - requestedQty)
            });
          }
        }
      }

      // PHASE 2 : WRITES
      for (const update of stockUpdates) {
        transaction.update(update.ref, { 
          [update.field]: update.newStock,
          isAvailable: update.newStock > 0
        });
      }

      const orderRef = doc(db, "orders", orderId);
      transaction.set(orderRef, {
        orderId,
        buyerId: buyerProfile.uid,
        buyerName: buyerProfile.displayName || buyerProfile.companyName || "Client B2B",
        buyerCompany: buyerProfile.companyName || "-",
        buyerSiret: buyerProfile.siret || "-",
        buyerRole: buyerProfile.role || "acheteur_prive",
        isPublicSector: buyerProfile.role === "acheteur_public",
        refEngagement: checkoutOptions.refEngagement || null,
        paymentMethod: checkoutOptions.paymentMethod || "stripe_card",
        paymentStatus: checkoutOptions.paymentMethod === "mandat_public" ? "PENDING_CHORUS" : "PAID_ESCROW",
        deliveryDate: checkoutOptions.deliveryDate || new Date().toISOString(),
        deliveryInstructions: checkoutOptions.deliveryInstructions || "",
        status: "A_PREPARER",
        totals,
        subOrders,
        createdAt: serverTimestamp()
      });

      Object.entries(subOrders).forEach(([producerId, subData]) => {
        const subOrderRef = doc(collection(db, "sub_orders"));
        transaction.set(subOrderRef, {
          subOrderId: `${orderId}-${producerId.substring(0, 5)}`,
          parentOrderId: orderId,
          producerId,
          producerName: subData.producerName,
          stripeAccountId: subData.stripeAccountId,
          buyerName: buyerProfile.companyName || buyerProfile.displayName,
          buyerSiret: buyerProfile.siret,
          items: subData.items,
          totalHT: subData.totalHT,
          totalVAT: subData.totalVAT,
          totalTTC: subData.totalHT + subData.totalVAT,
          marketplaceCommissionHT: subData.commissionHT,
          deliveryDate: checkoutOptions.deliveryDate,
          deliveryInstructions: checkoutOptions.deliveryInstructions,
          status: "A_PREPARER",
          createdAt: serverTimestamp()
        });
      });

      if (buyerProfile.role === "acheteur_public") {
        const chorusRef = doc(collection(db, "chorus_queue"));
        transaction.set(chorusRef, {
          orderId,
          refEngagement: checkoutOptions.refEngagement,
          buyerSiret: buyerProfile.siret,
          amountTTC: totals.grandTotalTTC,
          status: "PENDING_TRANSMISSION",
          createdAt: serverTimestamp()
        });
      }
    });

    return {
      success: true,
      orderId,
      amountTTC: totals.grandTotalTTC,
      paymentMethod: checkoutOptions.paymentMethod
    };
  }
};

export default CheckoutOrchestrator;
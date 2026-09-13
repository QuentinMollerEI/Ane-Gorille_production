import { db } from "../config/firebase";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

export const OrderOrchestrator = {
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems?.length) throw new Error("Panier invalide.");

    const orderRef = doc(collection(db, "orders"));
    const isB2G = buyerProfile.role === "acheteur_public" || buyerProfile.buyerProfile === "B2G";
    
    // Obligation légale B2G : Le numéro d'engagement est requis pour Chorus Pro.
    if (isB2G && !checkoutOptions.refEngagement) {
        throw new Error("La facturation publique Chorus Pro nécessite un numéro d'engagement.");
    }

    const itemsByProducer = this._groupItems(cartItems);

    await runTransaction(db, async (transaction) => {
      const productSnaps = await Promise.all(
        cartItems.map(item => transaction.get(doc(db, "products", item.id)))
      );

      let totalAmount = 0;
      productSnaps.forEach((snap, index) => {
        if (!snap.exists()) throw new Error("Produit indisponible.");
        const item = cartItems[index];
        const stock = Number(snap.data().stock || 0);
        const qty = Number(item.quantity || 1);
        
        if (stock < qty) throw new Error(`Stock insuffisant pour ${item.title}.`);
        totalAmount += Number(item.priceHT) * qty;
        
        transaction.update(snap.ref, { stock: stock - qty, isAvailable: (stock - qty) > 0 });
      });

      transaction.set(orderRef, {
        id: orderRef.id,
        buyerId: buyerProfile.uid,
        buyerRole: buyerProfile.role,
        siretBuyer: buyerProfile.siret || "-",
        refEngagement: checkoutOptions.refEngagement || "-",
        paymentMethod: isB2G ? "mandat_public" : "stripe_b2b",
        totalAmount,
        status: "A_PREPARER",
        deliveryDetails: checkoutOptions.deliveryDetails || {},
        createdAt: serverTimestamp()
      });

      Object.entries(itemsByProducer).forEach(([producerId, group]) => {
        const subRef = doc(collection(db, "sub_orders"));
        transaction.set(subRef, {
          id: subRef.id,
          parentOrderId: orderRef.id,
          producerId,
          buyerId: buyerProfile.uid,
          status: "A_PREPARER",
          amount: group.totalAmount,
          items: group.items,
          createdAt: serverTimestamp()
        });
      });
    });

    return { success: true, orderId: orderRef.id };
  },

  _groupItems(items) {
    return items.reduce((acc, item) => {
      if (!acc[item.producerId]) acc[item.producerId] = { items: [], totalAmount: 0 };
      acc[item.producerId].items.push(item);
      acc[item.producerId].totalAmount += item.priceHT * (item.quantity || 1);
      return acc;
    }, {});
  }
};
import { db } from "../config/firebase.js";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * ⚙️ CHECKOUT ORCHESTRATOR
 * Service transactionnel atomique gérant la décrémentation des stocks,
 * le découpage des sous-commandes par producteur, la commission 12% et le B2G Chorus Pro.
 */
export const CheckoutOrchestrator = {
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid) throw new Error("Acheteur non authentifié.");
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Le panier d'approvisionnement est vide.");
    }

    const isB2G = buyerProfile.role === "acheteur_public" || buyerProfile.buyerProfile === "B2G";

    if (isB2G && !checkoutOptions.refEngagement) {
      throw new Error("Contrainte B2G Chorus Pro : Le numéro d'engagement budgétaire (refEngagement) est obligatoire.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    // Regroupement par producteur / fournisseur
    const itemsByProducer = this._groupItemsByProducer(cartItems);

    await runTransaction(db, async (transaction) => {
      // 1. Lecture atomique des stocks en rayon
      const productSnaps = await Promise.all(
        cartItems.map(item => transaction.get(doc(db, "products", item.id)))
      );

      let globalTotalHT = 0;

      // 2. Vérification des stocks & prix
      productSnaps.forEach((snap, index) => {
        if (!snap.exists()) {
          throw new Error(`Produit indisponible : ${cartItems[index].title || 'Article'}`);
        }
        const pData = snap.data();
        const item = cartItems[index];
        const stock = Number(pData.stock ?? pData.quantity ?? 0);
        const qty = Number(item.quantity ?? 1);

        if (stock < qty) {
          throw new Error(`Stock insuffisant chez le maraîcher pour ${item.title}. Disponible: ${stock}`);
        }

        // Prix HT certifié depuis Firestore
        const unitPriceHT = Number(pData.priceHT ?? pData.price ?? item.priceHT ?? 0);
        globalTotalHT += unitPriceHT * qty;

        // Décrémentation atomique
        const newStock = stock - qty;
        transaction.update(snap.ref, {
          stock: newStock,
          quantity: newStock,
          isAvailable: newStock > 0,
          updatedAt: serverTimestamp()
        });
      });

      // Calcul des frais de port B2B/B2G
      let deliveryFeeHT = 15;
      if (globalTotalHT >= 300) deliveryFeeHT = 0;
      else if (globalTotalHT >= 150) deliveryFeeHT = 8;

      const foodVAT = globalTotalHT * 0.055;
      const deliveryVAT = deliveryFeeHT * 0.20;
      const grandTotalTTC = globalTotalHT + foodVAT + deliveryFeeHT + deliveryVAT;

      // 3. Écriture de la commande principale
      transaction.set(orderRef, {
        id: orderId,
        buyerId: buyerProfile.uid,
        buyerName: buyerProfile.companyName || buyerProfile.displayName || "Acheteur Pro",
        buyerRole: buyerProfile.role || "acheteur_prive",
        siretBuyer: buyerProfile.siret || "-",
        refEngagement: checkoutOptions.refEngagement || "-",
        paymentMethod: isB2G ? "mandat_public" : "stripe_b2b",
        totalAmountHT: globalTotalHT,
        foodVAT,
        deliveryFeeHT,
        deliveryVAT,
        grandTotalTTC,
        status: "A_PREPARER",
        deliveryDetails: checkoutOptions.deliveryDetails || {},
        deliveryAddress: checkoutOptions.deliveryAddress || buyerProfile.address || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 4. Écriture des sous-commandes par producteur (sub_orders)
      Object.entries(itemsByProducer).forEach(([producerId, group]) => {
        const subOrderRef = doc(collection(db, "sub_orders"));
        
        // Division 0.88 : Marge marketplace 12%
        const producerNetHT = group.subtotalHT * 0.88;
        const marketplaceCommissionHT = group.subtotalHT * 0.12;

        transaction.set(subOrderRef, {
          id: subOrderRef.id,
          parentOrderId: orderId,
          producerId,
          producerName: group.producerName,
          buyerId: buyerProfile.uid,
          buyerName: buyerProfile.companyName || buyerProfile.displayName || "Acheteur",
          status: "A_PREPARER",
          amountHT: group.subtotalHT,
          producerNetHT,
          marketplaceCommissionHT,
          items: group.items,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    });

    return { success: true, orderId };
  },

  _groupItemsByProducer(items) {
    return items.reduce((acc, item) => {
      const pId = item.producerId || item.userId || "PROD_LOCAL";
      const pName = item.producerCompany || item.producerName || "Exploitation Locale";
      
      if (!acc[pId]) {
        acc[pId] = { producerName: pName, items: [], subtotalHT: 0 };
      }
      const price = Number(item.priceHT ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      
      acc[pId].items.push({ ...item, priceHT: price, quantity: qty });
      acc[pId].subtotalHT += price * qty;
      return acc;
    }, {});
  }
};

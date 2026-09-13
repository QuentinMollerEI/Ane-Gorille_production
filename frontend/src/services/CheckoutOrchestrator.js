// src/services/CheckoutOrchestrator.js
import { db } from "../config/firebase";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

export const CheckoutOrchestrator = {
  
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    const isPublicSector = buyerProfile.role === "acheteur_public" || buyerProfile.buyerProfile === "B2G";
    const paymentMethod = isPublicSector ? "mandat_public" : "stripe_b2b";
    
    // Regroupement des articles par maraîcher pour faciliter la logistique locale
    const itemsByProducer = cartItems.reduce((acc, item) => {
      const pId = item.producerId || "PROD_INCONNU";
      if (!acc[pId]) {
        acc[pId] = { producerName: item.producerName || "Maraîcher Local", items: [], totalAmount: 0 };
      }
      acc[pId].items.push(item);
      acc[pId].totalAmount += Number(item.priceHT || item.price || 0) * Number(item.quantity || item.qty || 1);
      return acc;
    }, {});

    try {
      // Exécution d'une TRANSACTION ATOMIQUE : Sécurise la décrémentation des stocks
      await runTransaction(db, async (transaction) => {
        const productSnaps = [];
        let globalTotalAmount = 0;

        // ÉTAPE 1 : LECTURES SEULES (Obligatoire dans Firestore avant les écritures)
        for (const item of cartItems) {
          if (!item.id) continue;
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          productSnaps.push({ item, productRef, snap });
        }

        // ÉTAPE 2 : VÉRIFICATIONS (Anti-Rupture de Stock)
        for (const { item, snap } of productSnaps) {
          if (!snap.exists()) {
            throw new Error(`Le produit "${item.title || item.name}" a été retiré de la vente.`);
          }
          const currentStock = Number(snap.data().stock || 0);
          const requestedQty = Number(item.quantity || item.qty || 1);
          
          if (currentStock < requestedQty) {
            throw new Error(`Stock insuffisant pour "${item.title || item.name}". Disponible : ${currentStock}`);
          }
          globalTotalAmount += Number(item.priceHT || item.price || 0) * requestedQty;
        }

        // ÉTAPE 3 : ÉCRITURES ATOMIQUES
        // 3A. Mise à jour des stocks
        for (const { item, productRef, snap } of productSnaps) {
          const newStock = Number(snap.data().stock) - Number(item.quantity || item.qty || 1);
          transaction.update(productRef, { 
            stock: newStock,
            isAvailable: newStock > 0 
          });
        }

        // 3B. Écriture de la commande globale
        const globalOrder = {
          id: orderId,
          buyerId: buyerProfile.uid,
          buyerName: buyerProfile.companyName || buyerProfile.displayName || "Acheteur",
          buyerRole: buyerProfile.role || "acheteur_prive",
          siretBuyer: buyerProfile.siret || "-",
          refEngagement: checkoutOptions.refEngagement || "-",
          paymentMethod: paymentMethod,
          totalAmount: globalTotalAmount,
          status: "A_PREPARER",
          deliveryAddress: checkoutOptions.deliveryAddress || buyerProfile.address || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          items: cartItems.map(item => ({
            id: item.id,
            name: item.title || item.name,
            price: Number(item.priceHT || item.price || 0),
            quantity: Number(item.quantity || item.qty || 1),
            producerId: item.producerId,
            producerName: item.producerName
          }))
        };
        transaction.set(orderRef, globalOrder);

        // 3C. Génération des sous-commandes pour les maraîchers (Bons de Préparation)
        for (const [producerId, group] of Object.entries(itemsByProducer)) {
          const subOrderRef = doc(collection(db, "sub_orders"));
          transaction.set(subOrderRef, {
            id: subOrderRef.id,
            parentOrderId: orderId,
            producerId: producerId,
            producerName: group.producerName,
            buyerId: buyerProfile.uid,
            buyerName: globalOrder.buyerName,
            status: "A_PREPARER",
            amount: group.totalAmount,
            items: group.items,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      });

      return { success: true, orderId, paymentMethod };

    } catch (error) {
      console.error("[CheckoutOrchestrator] Échec de la transaction :", error);
      throw error; 
    }
  }
};
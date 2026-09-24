/**
 * 🛒 SERVICE CENTRAL : CheckoutOrchestrator.js
 * Emplacement : frontend/src/services/CheckoutOrchestrator.js
 * 
 * Rôle : Orchestrateur de transactions (Paiement et création de la commande).
 * Conforme au modèle économique de l'EI : Commission 12% et frais de port dégressifs (15€, 8€, 0€).
 */
import { db } from "../config/firebase";
import { getCalculatedDeliveryDate } from "../utils/deliveryCalendar.js";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

export function calculateDeliveryFee(subtotalHT) {
  const amount = Number(subtotalHT || 0);
  if (amount >= 300) return 0; // Niveau 3 : Franco de port
  if (amount >= 150) return 8; // Niveau 2 : Incitatif
  return 15; // Niveau 1 : Standard
}

export const CheckoutOrchestrator = {
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    const role = buyerProfile.role || buyerProfile.buyerRole || "client_pro";
    const isPublicSector = role === "acheteur_public" || role === "client_public" || buyerProfile.buyerProfile === "B2G";

    const paymentMethod = checkoutOptions.paymentMethod || (isPublicSector ? "mandat_public" : "stripe_b2b");
    
    if (isPublicSector && (!checkoutOptions.refEngagement || checkoutOptions.refEngagement.trim() === "" || checkoutOptions.refEngagement === "-")) {
      throw new Error("La facturation publique Chorus Pro exige un N° d'Engagement Budgétaire valide.");
    }

    let requestedDeliveryDate = checkoutOptions.deliveryDetails?.selectedDate || checkoutOptions.selectedDate || checkoutOptions.deliveryDate;
    if (!requestedDeliveryDate || requestedDeliveryDate.trim() === "" || requestedDeliveryDate === "Non spécifiée") {
      requestedDeliveryDate = getCalculatedDeliveryDate(new Date());
    }

    const deliveryDetailsObj = {
      selectedDate: requestedDeliveryDate,
      deliveryWindow: checkoutOptions.deliveryDetails?.deliveryWindow || "06:00 - 08:00",
      instructions: checkoutOptions.deliveryDetails?.instructions || ""
    };

    const itemsByProducer = cartItems.reduce((acc, item) => {
      const pId = item.producerId || "PROD_INCONNU";
      if (!acc[pId]) {
        acc[pId] = { producerName: item.producerName || item.producer || "Maraîcher Local", items: [], totalAmountHT: 0 };
      }
      const qty = Number(item.quantity || item.qty || 1);
      const pHT = Number(item.priceHT ?? item.price ?? 0);
      acc[pId].items.push(item);
      acc[pId].totalAmountHT += pHT * qty;
      return acc;
    }, {});

    try {
      await runTransaction(db, async (transaction) => {
        const productSnaps = [];
        let globalTotalHT = 0;
        let vatProducts = 0; // Déclaration unique

        // ÉTAPE A : Lectures strictes Firestore
        for (const item of cartItems) {
          if (!item.id) continue;
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          productSnaps.push({ item, productRef, snap });
        }

        // ÉTAPE B : Vérification des stocks & calcul sécurisé avec TVA dynamique
        for (const { item, snap } of productSnaps) {
          if (!snap.exists()) {
            throw new Error(`Le produit "${item.title || item.name}" n'est plus disponible en rayon.`);
          }
          const pData = snap.data();
          const currentStock = Number(pData.stock || 0);
          const requestedQty = Number(item.quantity || item.qty || 1);
          
          if (currentStock < requestedQty) {
            throw new Error(`Stock insuffisant pour "${pData.title || pData.name}". Restant : ${currentStock}`);
          }
          
          const priceHT = Number(pData.priceHT ?? pData.price ?? item.priceHT ?? item.price ?? 0);
          const vatRate = Number(pData.vatRate ?? item.vatRate ?? 5.5) / 100;
          
          const lineTotalHT = priceHT * requestedQty;
          globalTotalHT += lineTotalHT;
          vatProducts += lineTotalHT * vatRate;
        }

        // ÉTAPE C : Calculs financiers exhaustifs
        const deliveryFee = calculateDeliveryFee(globalTotalHT);
        const vatDelivery = deliveryFee * 0.20;      
        const totalVAT = vatProducts + vatDelivery;
        const totalTTC = globalTotalHT + deliveryFee + totalVAT;

        // ÉTAPE D : Écritures atomiques
        for (const { item, productRef, snap } of productSnaps) {
          const pData = snap.data();
          const currentStock = Number(pData.stock || 0);
          const requestedQty = Number(item.quantity || item.qty || 1);
          const newStock = currentStock - requestedQty;

          transaction.update(productRef, {
            stock: newStock,
            isAvailable: newStock > 0,
            updatedAt: serverTimestamp()
          });
        }

        const globalOrder = {
          id: orderId,
          orderNumber: `CMD-${orderId.substring(0, 8).toUpperCase()}`,
          buyerId: buyerProfile.uid,
          buyerName: buyerProfile.companyName || buyerProfile.displayName || "Acheteur Client",
          buyerRole: role,
          siretBuyer: buyerProfile.siret || "-",
          refEngagement: checkoutOptions.refEngagement || "-",
          paymentMethod: paymentMethod,
          totalHT: Number(globalTotalHT.toFixed(2)),
          deliveryFee: Number(deliveryFee.toFixed(2)),
          deliveryFeeHT: Number(deliveryFee.toFixed(2)),
          vatProducts: Number(vatProducts.toFixed(2)),
          vatDelivery: Number(vatDelivery.toFixed(2)),
          totalVAT: Number(totalVAT.toFixed(2)),
          totalTTC: Number(totalTTC.toFixed(2)),
          amountHT: Number(globalTotalHT.toFixed(2)),
          amountTTC: Number(totalTTC.toFixed(2)),
          totalAmount: Number(totalTTC.toFixed(2)),
          amount: Number(totalTTC.toFixed(2)),
          commissionRate: 12,
          status: "paid",
          selectedDate: requestedDeliveryDate,
          deliveryDate: requestedDeliveryDate,
          deliveryDetails: deliveryDetailsObj,
          deliveryAddress: checkoutOptions.deliveryAddress || buyerProfile.address || "Adresse de livraison",
          producerIds: Object.keys(itemsByProducer),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          items: cartItems.map(i => ({
            id: i.id,
            name: i.title || i.name,
            title: i.title || i.name,
            priceHT: Number(i.priceHT ?? i.price ?? 0),
            price: Number(i.priceHT ?? i.price ?? 0),
            quantity: Number(i.quantity || i.qty || 1),
            unit: i.unit || "kg",
            producerId: i.producerId,
            producerName: i.producerName || i.producer
          }))
        };
        transaction.set(orderRef, globalOrder);

        for (const [producerId, group] of Object.entries(itemsByProducer)) {
          const subOrderRef = doc(collection(db, "sub_orders"));
          const subAmountHT = group.totalAmountHT;
          const subAmountTTC = subAmountHT * 1.055;
          const commissionAmount = subAmountHT * 0.12;

          transaction.set(subOrderRef, {
            id: subOrderRef.id,
            orderId: orderId,
            parentOrderId: orderId,
            producerId: producerId,
            producerName: group.producerName,
            buyerId: buyerProfile.uid,
            buyerName: globalOrder.buyerName,
            status: "A_PREPARER",
            selectedDate: requestedDeliveryDate,
            deliveryDate: requestedDeliveryDate,
            deliveryDetails: deliveryDetailsObj,
            deliveryAddress: globalOrder.deliveryAddress,
            amountHT: Number(subAmountHT.toFixed(2)),
            amountTTC: Number(subAmountTTC.toFixed(2)),
            amount: Number(subAmountTTC.toFixed(2)),
            totalAmount: Number(subAmountTTC.toFixed(2)),
            commissionRate: 12,
            commissionAmount: Number(commissionAmount.toFixed(2)),
            netProducerAmount: Number((subAmountHT - commissionAmount).toFixed(2)),
            items: group.items,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      });

      return { success: true, orderId, paymentMethod };
    } catch (error) {
      console.error("[CheckoutOrchestrator] Échec du checkout :", error);
      throw error;
    }
  }
};

export const processCheckout = CheckoutOrchestrator.processCheckout;
export default CheckoutOrchestrator;
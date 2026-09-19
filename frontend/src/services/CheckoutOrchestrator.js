import { db } from "../config/firebase";
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";

export const CheckoutOrchestrator = {
  
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    const role = buyerProfile.role || buyerProfile.buyerRole || "client_pro";
    const isPublicSector = role === "acheteur_public" || role === "client_public" || buyerProfile.buyerProfile === "B2G";

    let paymentMethod = checkoutOptions.paymentMethod || (isPublicSector ? "mandat_public" : "stripe_b2b");
    
    if (isPublicSector && (!checkoutOptions.refEngagement || checkoutOptions.refEngagement.trim() === "" || checkoutOptions.refEngagement === "-")) {
      throw new Error("La facturation publique Chorus Pro exige un N° d'Engagement Budgétaire valide.");
    }

    const itemsByProducer = cartItems.reduce((acc, item) => {
      const pId = item.producerId || "PROD_INCONNU";
      if (!acc[pId]) {
        acc[pId] = { 
          producerName: item.producerName || item.producer || "Maraîcher Local", 
          items: [], 
          totalAmountHT: 0 
        };
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

        for (const item of cartItems) {
          if (!item.id) continue;
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          productSnaps.push({ item, productRef, snap });
        }

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
          globalTotalHT += priceHT * requestedQty;
        }

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

        const totalVAT = globalTotalHT * 0.055;
        const totalTTC = globalTotalHT + totalVAT;

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
          totalVAT: Number(totalVAT.toFixed(2)),
          totalTTC: Number(totalTTC.toFixed(2)),
          amountHT: Number(globalTotalHT.toFixed(2)),
          amountTTC: Number(totalTTC.toFixed(2)),
          totalAmount: Number(totalTTC.toFixed(2)),
          amount: Number(totalTTC.toFixed(2)),
          status: "paid",
          deliveryDetails: {
            selectedDate: checkoutOptions.deliveryDetails?.selectedDate || new Date().toISOString().split("T")[0],
            deliveryWindow: checkoutOptions.deliveryDetails?.deliveryWindow || "06:00 - 08:00",
            instructions: checkoutOptions.deliveryDetails?.instructions || ""
          },
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

          transaction.set(subOrderRef, {
            id: subOrderRef.id,
            orderId: orderId,
            parentOrderId: orderId,
            producerId: producerId,
            producerName: group.producerName,
            buyerId: buyerProfile.uid,
            buyerName: globalOrder.buyerName,
            status: "A_PREPARER",
            amountHT: Number(subAmountHT.toFixed(2)),
            amountTTC: Number(subAmountTTC.toFixed(2)),
            amount: Number(subAmountTTC.toFixed(2)),
            totalAmount: Number(subAmountTTC.toFixed(2)),
            commissionAmount: Number((subAmountHT * 0.18).toFixed(2)),
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
  },

  async startHarvest(subOrderId) {
    if (!subOrderId) return;
    const subRef = doc(db, "sub_orders", subOrderId);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) return;

    const subData = subSnap.data();
    await runTransaction(db, async (transaction) => {
      transaction.update(subRef, {
        status: "HARVESTING",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (subData.parentOrderId || subData.orderId) {
        const pId = subData.parentOrderId || subData.orderId;
        const parentRef = doc(db, "orders", pId);
        transaction.update(parentRef, {
          status: "preparing",
          updatedAt: serverTimestamp()
        });
      }
    });
  },

  async validatePreparation(subOrder, lotNumber) {
    if (!subOrder?.id) return;
    const defaultLot = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalLot = (lotNumber || subOrder.lotNumber || subOrder.batchNumber || defaultLot).trim();

    const subRef = doc(db, "sub_orders", subOrder.id);
    const parentOrderId = subOrder.parentOrderId || subOrder.orderId;

    await runTransaction(db, async (transaction) => {
      transaction.update(subRef, {
        status: "A_RAMASSER",
        lotNumber: finalLot,
        batchNumber: finalLot,
        preparedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (parentOrderId) {
        const qSiblings = query(collection(db, "sub_orders"), where("parentOrderId", "==", parentOrderId));
        const snap = await getDocs(qSiblings);
        const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allReady = allSubs.length > 0 && allSubs.every(s => 
          s.id === subOrder.id || ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(s.status)
        );

        const newOrderStatus = allReady ? "ready_for_pickup" : "preparing";
        const orderRef = doc(db, "orders", parentOrderId);
        transaction.update(orderRef, {
          status: newOrderStatus,
          updatedAt: serverTimestamp()
        });
      }
    });
  }
};

export const processCheckout = CheckoutOrchestrator.processCheckout;
export const startHarvest = CheckoutOrchestrator.startHarvest;
export const validatePreparation = CheckoutOrchestrator.validatePreparation;

export default CheckoutOrchestrator;

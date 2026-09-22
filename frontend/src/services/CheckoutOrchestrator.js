/**
 * 🌾 SERVICE CENTRAL : CheckoutOrchestrator.js
 * Orchestrateur de transactions, préparation, livraison et génération comptable Factur-X / Chorus Pro.
 * Conforme au nouveau modèle économique de l'EI (Régime réel simplifié de TVA) :
 * 1. Commission de service fixe de 12 % (au lieu de 18 %).
 * 2. Grille tarifaire de livraison B2B dégressive par paliers :
 *    - Niveau 1 Standard (< 150 € HT) : 15 € HT
 *    - Niveau 2 Incitatif (150 € à 299,99 € HT) : 8 € HT
 *    - Niveau 3 Franco de port (>= 300 € HT) : 0 € (Livraison offerte)
 */
import { db } from "../config/firebase";
import { getCalculatedDeliveryDate, formatDateToYYYYMMDD } from "../utils/deliveryCalendar.js";
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

/**
 * 🚚 Calculateur universel des Frais de Livraison B2B Dégressifs
 * @param {number} subtotalHT - Montant total HT des produits du panier
 * @returns {number} Montant des frais de port en € HT
 */
export function calculateDeliveryFee(subtotalHT) {
  const amount = Number(subtotalHT || 0);
  if (amount >= 300) {
    return 0; // Niveau 3 : Franco de port
  }
  if (amount >= 150) {
    return 8; // Niveau 2 : Incitatif (150 € - 299,99 €)
  }
  return 15; // Niveau 1 : Standard (< 150 €)
}

export const CheckoutOrchestrator = {
  
  /**
   * 1. VALIDATION DU PANIER & TRANSACTIONS ATOMIQUES (3 Modes de Paiement + Grille 12% + Port Dégressif + Ancrage Date de Livraison)
   */
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    const role = buyerProfile.role || buyerProfile.buyerRole || "client_pro";
    const isPublicSector = role === "acheteur_public" || role === "client_public" || buyerProfile.buyerProfile === "B2G";

    // Détermination du mode de règlement
    let paymentMethod = checkoutOptions.paymentMethod || (isPublicSector ? "mandat_public" : "stripe_b2b");
    
    // Contrainte B2G Chorus Pro : N° d'engagement budgétaire obligatoire
    if (isPublicSector && (!checkoutOptions.refEngagement || checkoutOptions.refEngagement.trim() === "" || checkoutOptions.refEngagement === "-")) {
      throw new Error("La facturation publique Chorus Pro exige un N° d'Engagement Budgétaire valide.");
    }

    // Récupération sécurisée de la DATE DE LIVRAISON SOUHAITÉE
    let requestedDeliveryDate = 
      checkoutOptions.deliveryDetails?.selectedDate || 
      checkoutOptions.selectedDate || 
      checkoutOptions.deliveryDate;

    if (!requestedDeliveryDate || requestedDeliveryDate.trim() === "" || requestedDeliveryDate === "Non spécifiée") {
      requestedDeliveryDate = getCalculatedDeliveryDate(new Date());
    }

    const deliveryDetailsObj = {
      selectedDate: requestedDeliveryDate,
      deliveryWindow: checkoutOptions.deliveryDetails?.deliveryWindow || "06:00 - 08:00",
      instructions: checkoutOptions.deliveryDetails?.instructions || ""
    };

    // Regroupement des articles par producteur/maraîcher
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

        // ÉTAPE A : Lectures strictes Firestore
        for (const item of cartItems) {
          if (!item.id) continue;
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          productSnaps.push({ item, productRef, snap });
        }

        // ÉTAPE B : Vérification des stocks & calcul sécurisé
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

        // ÉTAPE C : Calculs financiers exhaustifs
        const deliveryFee = calculateDeliveryFee(globalTotalHT);
        const vatProducts = globalTotalHT * 0.055;  // TVA Alimentation 5.5%
        const vatDelivery = deliveryFee * 0.20;      // TVA Prestation Transport 20.0%
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

        // Création de la commande parente globale (orders)
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

        // Création des sous-commandes individuelles par maraîcher (sub_orders)
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
  },

  /**
   * 2. ESPACE PRODUCTEUR : DÉMARRAGE DE LA RÉCOLTE
   */
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

  /**
   * 3. ESPACE PRODUCTEUR : VALIDATION RÉCOLTE & SAISIE LOT HACCP
   */
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
  },

  /**
   * 4. ESPACE LIVREUR : REMISE PHYSIQUE, HACCP & GÉNÉRATION COMPTABLE
   */
  async validateDelivery(orderId, tempHaccp, signatureBase64, recipientName = "") {
    if (!orderId) throw new Error("L'identifiant de la commande est requis.");
    if (tempHaccp === undefined || tempHaccp === null) throw new Error("Le relevé de température HACCP est obligatoire.");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error("Commande introuvable.");

    const orderData = orderSnap.data();

    const qSubs = query(collection(db, "sub_orders"), where("parentOrderId", "==", orderId));
    const subSnaps = await getDocs(qSubs);
    const subOrders = subSnaps.docs.map(d => ({ id: d.id, ...d.data() }));

    const isMandatPublic = orderData.paymentMethod === "mandat_public" || orderData.buyerRole === "acheteur_public";

    await runTransaction(db, async (transaction) => {
      transaction.update(orderRef, {
        status: "delivered",
        deliveredAt: serverTimestamp(),
        tempHaccp: Number(tempHaccp),
        recipientName: recipientName || "-",
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        updatedAt: serverTimestamp()
      });

      subOrders.forEach((so) => {
        const soRef = doc(db, "sub_orders", so.id);
        transaction.update(soRef, {
          status: "DELIVERED",
          tempHaccp: Number(tempHaccp),
          recipientName: recipientName || "-",
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      const blDocId = `BL-${orderId.substring(0, 8).toUpperCase()}`;
      const blRef = doc(db, "documents", blDocId);
      transaction.set(blRef, {
        id: blDocId,
        orderId: orderId,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        selectedDate: orderData.selectedDate || orderData.deliveryDate || "-",
        type: "Bon de livraison",
        entity: "Plateforme Âne & Gorille",
        totalAmount: orderData.totalAmount || orderData.amountTTC || 0,
        tempHaccp: Number(tempHaccp),
        recipientName: recipientName || "-",
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        createdAt: serverTimestamp()
      }, { merge: true });

      subOrders.forEach((so) => {
        const vteDocId = `FAC-VTE-${so.id.substring(0, 8).toUpperCase()}`;
        const vteRef = doc(db, "documents", vteDocId);
        const subAmountHT = Number(so.amountHT || (so.amount ? so.amount / 1.055 : 0));
        const subAmountTTC = Number(so.amountTTC || so.amount || 0);

        transaction.set(vteRef, {
          id: vteDocId,
          orderId: orderId,
          subOrderId: so.id,
          type: "Facture de vente",
          legalMention: `Facture émise par Âne & Gorille au nom et pour le compte de ${so.producerName || "Producteur"}`,
          producerId: so.producerId,
          producerName: so.producerName,
          buyerId: orderData.buyerId,
          buyerName: orderData.buyerName,
          amountHT: Number(subAmountHT.toFixed(2)),
          amountTTC: Number(subAmountTTC.toFixed(2)),
          vatRate: 5.5,
          status: isMandatPublic ? "pending_30d" : "paid",
          createdAt: serverTimestamp()
        });

        const comDocId = `FAC-COM-${so.id.substring(0, 8).toUpperCase()}`;
        const comRef = doc(db, "documents", comDocId);
        const commissionHT = subAmountHT * 0.12;
        const commissionTVA = commissionHT * 0.20;
        const commissionTTC = commissionHT + commissionTVA;

        transaction.set(comRef, {
          id: comDocId,
          orderId: orderId,
          subOrderId: so.id,
          type: "Frais de service (commission)",
          legalMention: "TVA 20% - Régime Réel Simplifié de TVA",
          producerId: so.producerId,
          producerName: so.producerName,
          amountHT: Number(commissionHT.toFixed(2)),
          amountVAT: Number(commissionTVA.toFixed(2)),
          amountTTC: Number(commissionTTC.toFixed(2)),
          vatRate: 20,
          status: "paid",
          createdAt: serverTimestamp()
        });
      });

      if (isMandatPublic) {
        const chorusQueueRef = doc(collection(db, "chorus_queue"));
        transaction.set(chorusQueueRef, {
          orderId: orderId,
          buyerSiret: orderData.siretBuyer || "-",
          refEngagement: orderData.refEngagement || "-",
          totalAmount: orderData.totalAmount || orderData.amountTTC || 0,
          status: "pending_transmission",
          createdAt: serverTimestamp()
        });
      }
    });

    return { success: true };
  }
};

export const processCheckout = CheckoutOrchestrator.processCheckout;
export const startHarvest = CheckoutOrchestrator.startHarvest;
export const validatePreparation = CheckoutOrchestrator.validatePreparation;
export const validateDelivery = CheckoutOrchestrator.validateDelivery;

export default CheckoutOrchestrator;

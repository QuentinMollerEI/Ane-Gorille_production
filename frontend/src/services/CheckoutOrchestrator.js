/**
 * 🌾 SERVICE CENTRAL : CheckoutOrchestrator.js
 * Orchestrateur de transactions, préparation, livraison et génération comptable Factur-X / Chorus Pro.
 * Conforme au nouveau modèle économique EI (Régime réel simplifié de TVA) :
 * 1. Séparation stricte des sous-commandes (sub_orders) par producteur / fournisseur.
 * 2. Commission de service fixe de 12 % HT (+ TVA 20 %).
 * 3. Grille tarifaire B2B de livraison dégressive par paliers :
 *    - Niveau 1 Standard (< 150 € HT) : 15 € HT (+ TVA 20 % = 18 € TTC)
 *    - Niveau 2 Incitatif (150 € à 299,99 € HT) : 8 € HT (+ TVA 20 % = 9,60 € TTC)
 *    - Niveau 3 Franco de port (>= 300 € HT) : 0 € (Livraison offerte)
 */
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
  calculateDeliveryFee,

  /**
   * 1. VALIDATION DU PANIER & TRANSACTIONS ATOMIQUES
   * (Découpage strict par producteur/fournisseur + Commission 12% HT + Port Dégressif + TVA Réel)
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

    try {
      await runTransaction(db, async (transaction) => {
        const productSnaps = [];

        // ÉTAPE A : Lectures strictes Firestore (Toutes les lectures avant les écritures)
        for (const item of cartItems) {
          if (!item.id) continue;
          const productRef = doc(db, "products", item.id);
          const snap = await transaction.get(productRef);
          productSnaps.push({ item, productRef, snap });
        }

        // ÉTAPE B : Vérification des stocks & regroupement STRICT par producteur/fournisseur
        let globalTotalHT = 0;
        const itemsByProducer = {};
        const enrichedCartItems = [];

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

          // 🎯 Extraction ultra-robuste de l'ID du producteur (priorité aux données Firestore pData, puis item)
          const producerId = pData.producerId || pData.producer || pData.producerUid || pData.supplierId || pData.userId || 
                             item.producerId || item.producer || item.producerUid || item.supplierId || item.vendorId || item.userId || "PROD_INCONNU";

          const producerName = pData.producerName || pData.producerCompany || pData.producer || pData.supplierName || 
                               item.producerName || item.producerCompany || item.producer || "Maraîcher Local";

          const enrichedItem = {
            id: item.id,
            name: pData.title || pData.name || item.title || item.name,
            title: pData.title || pData.name || item.title || item.name,
            priceHT: priceHT,
            price: priceHT,
            quantity: requestedQty,
            unit: pData.unit || item.unit || "kg",
            producerId: producerId,
            producerName: producerName,
            isBio: Boolean(pData.isBio || item.isBio),
            category: pData.category || item.category || "Légumes"
          };

          enrichedCartItems.push(enrichedItem);

          // Groupement par producteur
          if (!itemsByProducer[producerId]) {
            itemsByProducer[producerId] = {
              producerId: producerId,
              producerName: producerName,
              items: [],
              totalAmountHT: 0
            };
          }
          itemsByProducer[producerId].items.push(enrichedItem);
          itemsByProducer[producerId].totalAmountHT += priceHT * requestedQty;
        }

        // ÉTAPE C : Calculs financiers selon le Régime Réel de TVA
        const deliveryFeeHT = calculateDeliveryFee(globalTotalHT); // Port dégressif HT (0€ / 8€ / 15€)
        const deliveryFeeVAT = deliveryFeeHT * 0.20; // TVA 20 % prestation de transport
        const deliveryFeeTTC = deliveryFeeHT + deliveryFeeVAT;

        const foodVAT = globalTotalHT * 0.055; // TVA 5.5 % denrées alimentaires
        const totalVAT = foodVAT + deliveryFeeVAT;
        const totalTTC = globalTotalHT + foodVAT + deliveryFeeTTC;

        // ÉTAPE D : Écritures atomiques
        // 1. Décrémentation physique des stocks
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

        // 2. Création de la commande parente globale (orders)
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
          deliveryFee: Number(deliveryFeeHT.toFixed(2)),
          deliveryFeeHT: Number(deliveryFeeHT.toFixed(2)),
          deliveryFeeVAT: Number(deliveryFeeVAT.toFixed(2)),
          deliveryFeeTTC: Number(deliveryFeeTTC.toFixed(2)),
          foodVAT: Number(foodVAT.toFixed(2)),
          totalVAT: Number(totalVAT.toFixed(2)),
          totalTTC: Number(totalTTC.toFixed(2)),
          amountHT: Number(globalTotalHT.toFixed(2)),
          amountTTC: Number(totalTTC.toFixed(2)),
          totalAmount: Number(totalTTC.toFixed(2)),
          amount: Number(totalTTC.toFixed(2)),
          commissionRate: 12,
          status: "paid",
          deliveryDetails: {
            selectedDate: checkoutOptions.deliveryDetails?.selectedDate || new Date().toISOString().split("T")[0],
            deliveryWindow: checkoutOptions.deliveryDetails?.deliveryWindow || "06:00 - 08:00",
            instructions: checkoutOptions.deliveryDetails?.instructions || ""
          },
          deliveryAddress: checkoutOptions.deliveryAddress || buyerProfile.address || "Adresse de livraison",
          producerIds: Object.keys(itemsByProducer), // Liste exacte de tous les UIDs producteurs impliqués
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          items: enrichedCartItems
        };
        transaction.set(orderRef, globalOrder);

        // 3. Création des SOUS-COMMANDES INDIVIDUELLES (sub_orders) — 1 par Producteur/Fournisseur
        for (const [producerId, group] of Object.entries(itemsByProducer)) {
          const subOrderRef = doc(collection(db, "sub_orders"));
          const subAmountHT = group.totalAmountHT;
          const subAmountTTC = subAmountHT * 1.055;

          // Commission 12 % HT + TVA 20 % sur la commission (Services en Régime Réel)
          const commissionRate = 0.12;
          const commissionAmountHT = subAmountHT * commissionRate;
          const commissionVAT = commissionAmountHT * 0.20;
          const commissionAmountTTC = commissionAmountHT + commissionVAT;

          transaction.set(subOrderRef, {
            id: subOrderRef.id,
            orderId: orderId,
            parentOrderId: orderId,
            mainOrderId: orderId,
            producerId: producerId, // ✅ Identifiant exact du producteur
            producerName: group.producerName,
            buyerId: buyerProfile.uid,
            buyerName: globalOrder.buyerName,
            status: "A_PREPARER",
            amountHT: Number(subAmountHT.toFixed(2)),
            amountTTC: Number(subAmountTTC.toFixed(2)),
            amount: Number(subAmountTTC.toFixed(2)),
            totalAmount: Number(subAmountTTC.toFixed(2)),
            commissionRate: 12,
            commissionAmountHT: Number(commissionAmountHT.toFixed(2)),
            commissionVAT: Number(commissionVAT.toFixed(2)),
            commissionAmountTTC: Number(commissionAmountTTC.toFixed(2)),
            commissionAmount: Number(commissionAmountTTC.toFixed(2)),
            netProducerAmount: Number((subAmountHT - commissionAmountHT).toFixed(2)), // 88 % HT au producteur
            items: group.items, // Uniquement les produits de CE producteur
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
   * 4. ESPACE LIVREUR : REMISE PHYSIQUE, HACCP & GÉNÉRATION COMPTABLE (BL, FAC-VTE, FAC-COM, Chorus Pro)
   */
  async validateDelivery(orderId, tempHaccp, signatureBase64) {
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
      // 1. Clôture de la commande globale
      transaction.update(orderRef, {
        status: "delivered",
        deliveredAt: serverTimestamp(),
        tempHaccp: Number(tempHaccp),
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        updatedAt: serverTimestamp()
      });

      // 2. Clôture des sous-commandes producteurs
      subOrders.forEach((so) => {
        const soRef = doc(db, "sub_orders", so.id);
        transaction.update(soRef, {
          status: "DELIVERED",
          tempHaccp: Number(tempHaccp),
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // 3. Génération du Bon de Livraison (BL)
      const blDocId = `BL-${orderId.substring(0, 8).toUpperCase()}`;
      const blRef = doc(db, "documents", blDocId);
      transaction.set(blRef, {
        id: blDocId,
        orderId: orderId,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        type: "Bon de livraison",
        entity: "Plateforme Âne & Gorille",
        totalAmount: orderData.totalAmount || orderData.amountTTC || 0,
        tempHaccp: Number(tempHaccp),
        signature: signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        createdAt: serverTimestamp()
      }, { merge: true });

      // 4. Génération des Factures de Vente (FAC-VTE) et de Commissions (FAC-COM)
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

        // Facture de frais de service (Commission 12 % HT + TVA 20 % en Régime Réel)
        const comDocId = `FAC-COM-${so.id.substring(0, 8).toUpperCase()}`;
        const comRef = doc(db, "documents", comDocId);
        const commissionHT = subAmountHT * 0.12;
        const commissionVAT = commissionHT * 0.20;
        const commissionTTC = commissionHT + commissionVAT;

        transaction.set(comRef, {
          id: comDocId,
          orderId: orderId,
          subOrderId: so.id,
          type: "Frais de service (commission)",
          legalMention: "TVA 20% - Régime Réel Simplifié de TVA",
          producerId: so.producerId,
          producerName: so.producerName,
          amountHT: Number(commissionHT.toFixed(2)),
          amountVAT: Number(commissionVAT.toFixed(2)),
          amountTTC: Number(commissionTTC.toFixed(2)),
          vatRate: 20,
          status: "paid",
          createdAt: serverTimestamp()
        });
      });

      // 5. File d'attente Chorus Pro (B2G)
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
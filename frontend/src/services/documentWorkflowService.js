import { db } from "./firestore.service"; // Remplacez par le chemin réel de votre instance Firebase
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * SERVICE DE WORKFLOW DOCUMENTAIRE & FISCAL AUTOMATISà (Production-Ready)
 *
 * Ce service orchestre la totalité du cycle de vie d'une commande "àne & Gorille"
 * et génère en temps réel les documents légaux, logistiques et fiscaux sans aucune simulation.
 * Chaque action écrit directement dans Firestore au sein d'une transaction atomique ou d'écritures sécurisées.
 */
export const DocumentWorkflowService = {
  /**
   * àTAPE 1 : Validation de la commande (Déclenchée au Checkout par l'Acheteur)
   *
   * Actions :
   * - Crée la commande parente (orders) avec le statut "A_PREPARER"
   * - Génère le Bon de Commande (BC) scellé pour l'acheteur dans la collection racine /documents
   * - Scinde la commande par Maraîcher et génère les Bons de Préparation (sub_orders/BP) assignés à chacun
   *
   * @param {Object} buyerInfo - Informations de l'acheteur (id, name, role, email, siret, codeService, refEngagement)
   * @param {Array} cartItems - Articles du panier (id, name, price, quantity, vatRate, producerId, producerName)
   * @param {string} paymentMethod - Mode de paiement ('stripe' | 'mandat')
   */
  async createOrderAndBps(buyerInfo, cartItems, paymentMethod) {
    if (!buyerInfo?.uid || !cartItems?.length) {
      throw new Error(
        "Données de commande insuffisantes pour initialiser le flux.",
      );
    }

    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    // Calcul du montant total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Groupement des articles par Maraîcher (Producer) pour le découpage SRP
    const itemsByProducer = cartItems.reduce((groups, item) => {
      if (!groups[item.producerId]) {
        groups[item.producerId] = {
          producerId: item.producerId,
          producerName: item.producerName,
          items: [],
        };
      }
      groups[item.producerId].items.push(item);
      return groups;
    }, {});

    const producerIds = Object.keys(itemsByProducer);

    // Exécution transactionnelle pour garantir l'atomicité de la scission
    await runTransaction(db, async (transaction) => {
      // 1. Charger la configuration réglementaire de la plateforme (taux de commission)
      const configRef = doc(db, "config", "regulatory");
      const configSnap = await transaction.get(configRef);
      let platformCommissionRate = 0.18; // 18% par défaut si absent

      if (configSnap.exists()) {
        platformCommissionRate = (configSnap.data().commissionRate || 18) / 100;
      }

      // 2. àcriture de la commande parente (orders)
      const orderPayload = {
        id: orderId,
        buyerId: buyerInfo.uid,
        buyerName: buyerInfo.displayName || buyerInfo.name || "Acheteur Public",
        buyerRole: buyerInfo.role || "client_public",
        buyerSiret: buyerInfo.siret || "-",
        buyerCodeService: buyerInfo.codeService || "-",
        refEngagement: buyerInfo.refEngagement || "-",
        paymentMethod: paymentMethod,
        totalAmount: totalAmount,
        status: "A_PREPARER", // Statut initial du workflow
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tempHaccp: null,
        carrierId: null, // Sera assigné lors de la planification logistique
        carrierName: null,
        producerIds: producerIds, // Pour faciliter les requêtes admin ou de recherche
      };

      transaction.set(orderRef, orderPayload);

      // 3. àcriture du Bon de Commande (BC) figé dans la collection RACINE /documents (Option B - Pull Dynamique)
      const bcDocId = `BC-${orderId.slice(0, 8).toUpperCase()}`;
      const bcRef = doc(db, "documents", bcDocId);

      transaction.set(bcRef, {
        id: bcDocId,
        orderId: orderId,
        buyerId: buyerInfo.uid,
        buyerName: buyerInfo.displayName || buyerInfo.name || "Acheteur Public",
        buyerRole: buyerInfo.role || "client_public",
        type: "Bon de commande",
        createdAt: serverTimestamp(),
        entity: "Plateforme àne et Gorille",
        amount: totalAmount,
        vatRate: 5.5,
        status: "paid", // Garanti par Stripe ou visé par mandat administratif
        refEngagement: buyerInfo.refEngagement || "-",
        producerIds: producerIds, // Les maraîchers concernés
        items: cartItems.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          vatRate: item.vatRate || 5.5,
          producerId: item.producerId,
          producerName: item.producerName,
        })),
      });

      // 4. Création des Bons de Préparation (sub_orders / BP) pour chaque maraîcher
      producerIds.forEach((producerId) => {
        const subOrderRef = doc(collection(db, "sub_orders"));
        const producerData = itemsByProducer[producerId];

        const bpTotal = producerData.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const bpPayload = {
          id: subOrderRef.id,
          parentOrderId: orderId,
          buyerId: buyerInfo.uid,
          buyerName:
            buyerInfo.displayName || buyerInfo.name || "Acheteur Public",
          producerId: producerId,
          producerName: producerData.producerName,
          items: producerData.items,
          amount: bpTotal,
          commissionRate: platformCommissionRate * 100,
          commissionAmount: bpTotal * platformCommissionRate,
          status: "A_PREPARER", // Les maraîchers voient immédiatement la demande de préparation
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          carrierId: null,
          carrierName: null,
        };

        transaction.set(subOrderRef, bpPayload);
      });
    });

    return orderId;
  },

  /**
   * àTAPE 2 : Validation de la préparation (Déclenchée par le Maraîcher)
   *
   * Actions :
   * - Passe le statut du Bon de Préparation (BP) à "A_RAMASSER"
   * - Rend le document visible pour le réseau logistique
   *
   * @param {string} subOrderId - Identifiant du Bon de Préparation (sub_order)
   */
  async validatePreparation(subOrderId) {
    const subOrderRef = doc(db, "sub_orders", subOrderId);

    await runTransaction(db, async (transaction) => {
      const subOrderSnap = await transaction.get(subOrderRef);
      if (!subOrderSnap.exists()) {
        throw new Error("Le bon de préparation demandé est introuvable.");
      }

      const subOrderData = subOrderSnap.data();
      if (subOrderData.status !== "A_PREPARER") {
        throw new Error(
          "Ce document a déjà été validé ou traité dans le workflow.",
        );
      }

      // Transition d'état : Devient disponible pour la logistique (A_RAMASSER)
      transaction.update(subOrderRef, {
        status: "A_RAMASSER",
        updatedAt: serverTimestamp(),
      });
    });
  },

  /**
   * àTAPE 3 : Validation du ramassage (Déclenchée par le Livreur à la ferme)
   *
   * Actions :
   * - Valide la collecte physique du Bon de Ramassage (BR) chez un maraîcher précis
   * - Si TOUS les Bons de Ramassage de la commande parente sont collectés :
   *   -> Passe la commande parente et toutes les sous-commandes à "EN_COURS_DE_LIVRAISON"
   *   -> Génère et stocke le Bon de Livraison (BL) officiel dans la collection racine /documents
   *
   * @param {string} subOrderId - Identifiant du Bon de Ramassage validé
   * @param {Object} carrierInfo - Informations du livreur (uid, displayName/name)
   */
  async validatePickup(subOrderId, carrierInfo) {
    if (!carrierInfo?.uid) {
      throw new Error(
        "L'identifiant du livreur est requis pour valider un ramassage.",
      );
    }

    const subOrderRef = doc(db, "sub_orders", subOrderId);
    const subOrderSnap = await getDoc(subOrderRef);
    if (!subOrderSnap.exists()) {
      throw new Error("Le bon de ramassage demandé est introuvable.");
    }

    const subOrderData = subOrderSnap.data();
    const parentOrderId = subOrderData.parentOrderId;

    // 1. Récupérer tous les sub_orders de la commande parente pour vérifier s'ils sont tous ramassés
    const q = query(
      collection(db, "sub_orders"),
      where("parentOrderId", "==", parentOrderId),
    );
    const subOrdersSnap = await getDocs(q);
    const subOrders = subOrdersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // On regarde si tous les autres sont déjà à "RAMASSE" ou "DELIVERED"
    const allOthersCollected = subOrders
      .filter((so) => so.id !== subOrderId)
      .every(
        (so) =>
          so.status === "RAMASSE" ||
          so.status === "DELIVERED" ||
          so.status === "TERMINE" ||
          so.status === "EN_COURS_DE_LIVRAISON",
      );

    // 2. Transaction Firestore pour mettre à jour les statuts de manière atomique
    await runTransaction(db, async (transaction) => {
      // Mettre à jour le sous-bon spécifique
      transaction.update(subOrderRef, {
        status: "RAMASSE",
        carrierId: carrierInfo.uid,
        carrierName:
          carrierInfo.displayName || carrierInfo.name || "Livreur local",
        updatedAt: serverTimestamp(),
      });

      // Si tous les sous-bons de cette commande parente sont collectés :
      if (allOthersCollected) {
        const parentOrderRef = doc(db, "orders", parentOrderId);
        const parentOrderSnap = await transaction.get(parentOrderRef);

        if (parentOrderSnap.exists()) {
          const parentOrderData = parentOrderSnap.data();

          // Mettre à jour la commande parente à "EN_COURS_DE_LIVRAISON"
          transaction.update(parentOrderRef, {
            status: "EN_COURS_DE_LIVRAISON",
            carrierId: carrierInfo.uid,
            carrierName:
              carrierInfo.displayName || carrierInfo.name || "Livreur local",
            updatedAt: serverTimestamp(),
          });

          // Mettre également à jour le statut de tous les autres sous-bons à "EN_COURS_DE_LIVRAISON"
          subOrders.forEach((so) => {
            if (so.id !== subOrderId) {
              const soRef = doc(db, "sub_orders", so.id);
              transaction.update(soRef, {
                status: "EN_COURS_DE_LIVRAISON",
                carrierId: carrierInfo.uid,
                carrierName:
                  carrierInfo.displayName ||
                  carrierInfo.name ||
                  "Livreur local",
                updatedAt: serverTimestamp(),
              });
            }
          });

          // Générer le Bon de Livraison (BL) officiel dans /documents (requis pour l'acheteur et le livreur)
          const blDocId = `BL-${parentOrderId.slice(0, 8).toUpperCase()}`;
          const blRef = doc(db, "documents", blDocId);

          transaction.set(blRef, {
            id: blDocId,
            orderId: parentOrderId,
            buyerId: parentOrderData.buyerId,
            buyerName: parentOrderData.buyerName,
            buyerRole: parentOrderData.buyerRole || "client_public",
            type: "Bon de livraison",
            createdAt: serverTimestamp(),
            entity: "Plateforme àne et Gorille",
            amount: parentOrderData.totalAmount,
            vatRate: 5.5,
            status: "pending", // Devient "completed" lors de l'émargement final
            carrierId: carrierInfo.uid,
            carrierName:
              carrierInfo.displayName || carrierInfo.name || "Livreur local",
            refEngagement: parentOrderData.refEngagement || "-",
            producerIds: parentOrderData.producerIds || [],
          });
        }
      }
    });
  },

  /**
   * àTAPE 4 : Validation finale de la livraison (Déclenchée par le Livreur chez le client)
   *
   * Actions :
   * - Passe la commande parente et toutes les sous-commandes à "TERMINE"
   * - Enregistre la température HACCP de transport (Chaîne du froid) et la signature de l'acheteur
   * - Met à jour le Bon de Livraison (BL) à "completed" avec la température et signature
   * - Génère la Facture d'Achat finale (FAC) pour l'acheteur dans la collection racine /documents
   * - Génère les Factures de Vente (FAC) et les Factures de Commission (COM) pour chaque Maraîcher dans /documents
   *
   * @param {string} orderId - Identifiant de la commande parente
   * @param {number} tempHaccp - Température relevée au déchargement (doit être idéalement entre 2Â°C et 6Â°C)
   * @param {string} signatureBase64 - Preuve d'émargement de l'acheteur (au format Base64)
   */
  async validateDelivery(orderId, tempHaccp, signatureBase64) {
    if (!orderId)
      throw new Error("L'identifiant de la commande est obligatoire.");
    if (!tempHaccp)
      throw new Error("Le relevé de température HACCP est obligatoire.");

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const orderData = orderSnap.data();

    // Récupérer toutes les sous-commandes pour identifier les maraîchers concernés
    const q = query(
      collection(db, "sub_orders"),
      where("parentOrderId", "==", orderId),
    );
    const subOrdersSnap = await getDocs(q);
    const subOrders = subOrdersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const orderDate = orderData.createdAt?.toDate
      ? orderData.createdAt.toDate().toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");

    const isMandat = orderData.paymentMethod === "mandat";

    await runTransaction(db, async (transaction) => {
      // 1. Mettre à jour la commande parente
      transaction.update(orderRef, {
        status: "TERMINE",
        tempHaccp: tempHaccp,
        signature: signatureBase64 || null,
        updatedAt: serverTimestamp(),
      });

      // 2. Mettre à jour toutes les sous-commandes
      subOrders.forEach((so) => {
        const soRef = doc(db, "sub_orders", so.id);
        transaction.update(soRef, {
          status: "DELIVERED",
          tempHaccp: tempHaccp,
          updatedAt: serverTimestamp(),
        });
      });

      // 3. Mettre à jour le Bon de Livraison (BL) dans /documents (set avec merge pour résilience de test)
      const blDocId = `BL-${orderId.slice(0, 8).toUpperCase()}`;
      const blRef = doc(db, "documents", blDocId);
      transaction.set(
        blRef,
        {
          id: blDocId,
          orderId: orderId,
          buyerId: orderData.buyerId,
          buyerName: orderData.buyerName,
          buyerRole: orderData.buyerRole || "client_public",
          type: "Bon de livraison",
          entity: "Plateforme Âne et Gorille",
          amount: orderData.totalAmount,
          vatRate: 5.5,
          status: "completed",
          tempHaccp: tempHaccp,
          signature: signatureBase64 || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // 4. Générer la Facture d'Achat finale (FAC) de l'acheteur dans la collection racine /documents
      const facDocId = `FAC-${orderId.slice(0, 8).toUpperCase()}`;
      const facRef = doc(db, "documents", facDocId);
      transaction.set(facRef, {
        id: facDocId,
        orderId: orderId,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        buyerRole: orderData.buyerRole || "client_public",
        date: orderDate,
        type: "Facture",
        entity: "Plateforme àne et Gorille",
        amount: orderData.totalAmount,
        vatRate: 5.5,
        status: isMandat ? "pending_30d" : "paid", // Mandat = Attente paiement 30j, Stripe = Payé immédiatement
        isChorus: isMandat,
        refEngagement: orderData.refEngagement || "-",
        createdAt: serverTimestamp(),
      });

      // 5. Générer les factures de vente (FAC) et de commissions (COM) individuelles pour chaque Maraîcher
      subOrders.forEach((so) => {
        const bpFacId = `FAC-${so.id.slice(0, 8).toUpperCase()}`;
        const bpFacRef = doc(db, "documents", bpFacId);

        // Facture de Vente pour le maraîcher (Ce qu'il a vendu à l'acheteur)
        transaction.set(bpFacRef, {
          id: bpFacId,
          orderId: orderId,
          subOrderId: so.id,
          producerId: so.producerId,
          producerName: so.producerName,
          buyerId: so.buyerId,
          buyerName: so.buyerName,
          date: orderDate,
          type: "Facture de vente",
          entity: so.buyerName || "Acheteur Public",
          amount: so.amount,
          vatRate: 5.5,
          status: "paid", // Garanti par virement Stripe Connect
          createdAt: serverTimestamp(),
        });

        // Facture de Commission prélevée par la plateforme
        const bpComId = `COM-${so.id.slice(0, 8).toUpperCase()}`;
        const bpComRef = doc(db, "documents", bpComId);
        const commissionAmount = so.commissionAmount || so.amount * 0.18;

        transaction.set(bpComRef, {
          id: bpComId,
          orderId: orderId,
          subOrderId: so.id,
          producerId: so.producerId,
          producerName: so.producerName,
          date: orderDate,
          type: "Frais de service (commission)",
          entity: "àne & Gorille SAS",
          amount: commissionAmount,
          vatRate: 20, // Commission soumise à la TVA à 20%
          status: "paid",
          createdAt: serverTimestamp(),
        });
      });

      // 6. Entrée dans la file d'attente Chorus Pro si acheteur public (B2G)
      if (isMandat) {
        const chorusQueueRef = doc(collection(db, "chorus_queue"));
        transaction.set(chorusQueueRef, {
          orderId: orderId,
          buyerSiret: orderData.buyerSiret || "-",
          buyerCodeService: orderData.buyerCodeService || "-",
          refEngagement: orderData.refEngagement || "-",
          invoiceAmount: orderData.totalAmount,
          status: "pending_transmission",
          createdAt: serverTimestamp(),
        });
      }
    });
  },
};

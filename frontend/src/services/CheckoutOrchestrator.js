import { db } from "../config/firebase";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { getCalculatedDeliveryDate } from "../utils/deliveryCalendar.js";

/**
 * 🚚 Calculateur des Frais de Livraison B2B Dégressifs
 * - < 150 € HT : 15 € HT[cite: 7]
 * - 150 € à 299,99 € HT : 8 € HT[cite: 7]
 * - >= 300 € HT : 0 € (Franco de port)[cite: 7]
 */
export function calculateDeliveryFee(subtotalHT) {
  const amount = Number(subtotalHT || 0);
  if (amount >= 300) return 0;
  if (amount >= 150) return 8;
  return 15;
}

/**
 * 🌾 SERVICE CENTRAL : CheckoutOrchestrator
 * Gère la ventilation financière (DSP2), la validation des stocks et l'injection Chorus Pro.
 */
export const CheckoutOrchestrator = {
  
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    const role = buyerProfile.role || buyerProfile.buyerRole || "acheteur_prive";
    const isPublicSector = role === "acheteur_public" || role === "client_public" || buyerProfile.buyerProfile === "B2G";
    const paymentMethod = isPublicSector ? "mandat_public" : (checkoutOptions.paymentMethod || "stripe_b2b");

    // Validation stricte B2G : Numéro d'engagement budgétaire obligatoire[cite: 17]
    if (isPublicSector && (!checkoutOptions.refEngagement || checkoutOptions.refEngagement.trim() === "")) {
      throw new Error("La facturation publique Chorus Pro exige un N° d'Engagement Budgétaire valide.");
    }

    const requestedDeliveryDate = checkoutOptions.deliveryDetails?.selectedDate || getCalculatedDeliveryDate(new Date());
    const orderRef = doc(collection(db, "orders"));
    const orderId = orderRef.id;

    try {
      await runTransaction(db, async (transaction) => {
        let globalTotalProductsHT = 0;
        const productRefs = [];

        // 1. Vérification atomique des stocks (Anti-Overselling)
        for (const item of cartItems) {
          const pRef = doc(db, "products", item.id);
          const snap = await transaction.get(pRef);
          
          if (!snap.exists()) throw new Error(`Le produit ${item.title} est indisponible.`);
          
          const currentStock = Number(snap.data().stock || 0);
          const requestedQty = Number(item.quantity || 1);
          
          if (currentStock < requestedQty) throw new Error(`Stock insuffisant pour ${item.title}.`);
          
          const priceHT = Number(snap.data().priceHT || item.priceHT || 0);
          globalTotalProductsHT += priceHT * requestedQty;
          
          productRefs.push({ ref: pRef, newStock: currentStock - requestedQty });
        }

        // 2. Modèle Économique & Ventilation Financière (Conformité DSP2)
        const deliveryFeeHT = calculateDeliveryFee(globalTotalProductsHT);
        const globalTotalHT = globalTotalProductsHT + deliveryFeeHT;
        
        // Ségrégation des fonds : 12% pour le Hub, 88% pour le Producteur[cite: 17, 18]
        const platformCommissionHT = globalTotalProductsHT * 0.12; 
        const producerPayoutHT = globalTotalProductsHT * 0.88; 

        // 3. Décrémentation des stocks
        for (const { ref, newStock } of productRefs) {
          transaction.update(ref, { stock: newStock, isAvailable: newStock > 0 });
        }

        // 4. Création de la Commande Globale
        const orderData = {
          id: orderId,
          buyerId: buyerProfile.uid,
          buyerName: buyerProfile.companyName || buyerProfile.displayName || "Acheteur",
          siretBuyer: buyerProfile.siret || "-",
          refEngagement: checkoutOptions.refEngagement || "-",
          paymentMethod,
          totalProductsHT: globalTotalProductsHT,
          deliveryFeeHT,
          totalHT: globalTotalHT,
          platformCommissionHT,     // Trace comptable de la commission[cite: 11]
          producerPayoutHT,         // Montant à transférer via Stripe Connect
          status: "A_PREPARER",
          deliveryDate: requestedDeliveryDate,
          createdAt: serverTimestamp()
        };
        transaction.set(orderRef, orderData);

        // 5. Injection Chorus Pro pour le Secteur Public (B2G)[cite: 17, 18]
        if (isPublicSector) {
          const chorusRef = doc(collection(db, "chorus_queue"));
          transaction.set(chorusRef, {
            orderId,
            buyerSiret: orderData.siretBuyer,
            refEngagement: orderData.refEngagement,
            totalAmountHT: globalTotalHT,
            status: "pending_transmission",
            createdAt: serverTimestamp()
          });
        }
      });

      return { success: true, orderId, paymentMethod };
    } catch (error) {
      console.error("[CheckoutOrchestrator] Échec :", error);
      throw new Error(error.message || "Échec de la transaction sécurisée.");
    }
  }
};
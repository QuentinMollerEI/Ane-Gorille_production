import { auth } from "../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

export const CheckoutOrchestrator = {
  
  async processCheckout(buyerProfile, cartItems, checkoutOptions = {}) {
    if (!buyerProfile?.uid || !cartItems || cartItems.length === 0) {
      throw new Error("Données de commande invalides ou panier vide.");
    }

    try {
      // Instanciation explicite de la région pour éviter le 5 NOT_FOUND en Gen 2
      const functionsInstance = getFunctions(auth.app, "europe-west9");
      const processCheckoutFn = httpsCallable(functionsInstance, "processCheckoutServer");

      const response = await processCheckoutFn({
        buyerProfile,
        cartItems,
        checkoutOptions
      });

      if (!response.data?.success) {
        throw new Error("La création de la commande a échoué côté serveur.");
      }

      return { 
        success: true, 
        orderId: response.data.orderId 
      };

    } catch (error) {
      console.error("[CheckoutOrchestrator] Échec de la transaction :", error);
      const cleanMessage = error.message.replace("internal", "").replace("functions/", "").trim();
      throw new Error(cleanMessage || "Impossible de valider la commande suite à une erreur réseau ou de stock."); 
    }
  },

  async validateDelivery(orderId, tempHaccp, signatureBase64) {
    // Logique de validation de livraison existante
  }
};
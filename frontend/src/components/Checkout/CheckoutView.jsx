import React, { useState } from "react";
import { CreditCard, Building, ShieldCheck, Loader2 } from "lucide-react";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";

export default function CheckoutView({ cartItems, clearCart, onCheckoutSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("stripe_b2b"); // 'stripe_b2b' ou 'virement_b2b'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProcessOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Profil acheteur par défaut ou issu du contexte
      const buyerProfile = {
        uid: "USER_UID_TEST",
        role: "acheteur_prive",
        companyName: "Mon Restaurant B2B",
        siret: "12345678900012",
        address: "10 rue de la République, 31000 Toulouse"
      };

      const checkoutOptions = {
        paymentMethod: paymentMethod, // Transmet le choix de l'utilisateur
        deliveryDetails: { window: "08:00 - 10:00" }
      };

      const result = await CheckoutOrchestrator.processCheckout(
        buyerProfile, 
        cartItems, 
        checkoutOptions
      );

      if (result.success) {
        clearCart();
        if (onCheckoutSuccess) onCheckoutSuccess();
        alert(`Commande validée avec succès ! Référence : ${result.orderId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de la validation de la commande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 text-xs shadow-sm">
      <h3 className="font-extrabold text-gray-900 text-sm">Mode de Règlement B2B</h3>

      {/* Sélecteur des deux choix pour l'acheteur privé */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label 
          onClick={() => setPaymentMethod("stripe_b2b")}
          className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition ${
            paymentMethod === "stripe_b2b" ? "border-emerald-600 bg-emerald-50/40" : "border-gray-200"
          }`}
        >
          <input 
            type="radio" 
            name="paymentChoice" 
            checked={paymentMethod === "stripe_b2b"} 
            onChange={() => setPaymentMethod("stripe_b2b")}
            className="mt-1 text-emerald-600"
          />
          <div>
            <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
              <CreditCard size={15} className="text-emerald-700" /> Carte Bancaire / SEPA (Stripe Test)
            </span>
            <p className="text-[11px] text-gray-500 mt-1">
              Paiement sécurisé immédiat ou mandat de prélèvement testé via Stripe.
            </p>
          </div>
        </label>

        <label 
          onClick={() => setPaymentMethod("virement_b2b")}
          className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition ${
            paymentMethod === "virement_b2b" ? "border-emerald-600 bg-emerald-50/40" : "border-gray-200"
          }`}
        >
          <input 
            type="radio" 
            name="paymentChoice" 
            checked={paymentMethod === "virement_b2b"} 
            onChange={() => setPaymentMethod("virement_b2b")}
            className="mt-1 text-emerald-600"
          />
          <div>
            <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
              <Building size={15} className="text-blue-700" /> Virement Bancaire (LME 30 jours)
            </span>
            <p className="text-[11px] text-gray-500 mt-1">
              Génère un Bon de Commande officiel (BC) pour règlement différé interentreprises.
            </p>
          </div>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleProcessOrder}
        disabled={loading}
        className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-2xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:bg-gray-300"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        <span>{loading ? "Traitement de la transaction..." : "Valider mon panier B2B"}</span>
      </button>
    </div>
  );
}
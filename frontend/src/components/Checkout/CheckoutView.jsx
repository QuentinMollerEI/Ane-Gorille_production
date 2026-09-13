import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";
import CheckoutDeliverySelector from "./CheckoutDeliverySelector";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function CheckoutView({ cartItems, clearCart, onCheckoutSuccess }) {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const buyerProfile = userProfile || user || {};
  const isPublicBuyer = buyerProfile.role === "acheteur_public" || buyerProfile.role === "client_public" || buyerProfile.buyerProfile === "B2G";

  const [checkoutOptions, setCheckoutOptions] = useState({
    deliveryAddress: buyerProfile.address || "",
    refEngagement: buyerProfile.defaultEngagement || "",
    deliveryDetails: null 
  });

  const handleValidateOrder = async () => {
    setError("");

    if (!checkoutOptions.deliveryDetails?.selectedDate) {
      setError("Veuillez sélectionner une date de livraison pour valider votre commande.");
      return;
    }

    setLoading(true);
    try {
      await CheckoutOrchestrator.processCheckout(buyerProfile, cartItems, checkoutOptions);
      setSuccess(true);
      if (clearCart) clearCart();
      if (onCheckoutSuccess) setTimeout(onCheckoutSuccess, 3000);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la validation.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-8 bg-emerald-50 rounded-3xl border border-emerald-200 animate-fade-in">
        <ShieldCheck size={48} className="mx-auto text-emerald-600 mb-4" />
        <h2 className="text-xl font-black text-emerald-900">Commande validée !</h2>
        <p className="text-emerald-800 mt-2 text-xs font-medium leading-relaxed">
          Vos instructions logistiques ont été transmises au hub régional. Vos maraîchers préparent la récolte.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
      <h2 className="text-lg font-black text-gray-900">Validation & Logistique</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200 text-xs font-bold">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isPublicBuyer && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <label className="block text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider">
            N° d'Engagement Budgétaire (Chorus Pro) *
          </label>
          <input 
            type="text" 
            value={checkoutOptions.refEngagement}
            onChange={e => setCheckoutOptions(prev => ({...prev, refEngagement: e.target.value}))}
            className="w-full p-2.5 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-xs"
            placeholder="Ex: ENG-2026-908"
          />
        </div>
      )}

      <CheckoutDeliverySelector 
        onDeliveryChange={(details) => setCheckoutOptions((prev) => ({ ...prev, deliveryDetails: details }))} 
      />

      <button 
        onClick={handleValidateOrder} 
        disabled={loading || cartItems.length === 0}
        className="w-full bg-gray-900 hover:bg-black text-white font-black py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 text-sm shadow-md cursor-pointer"
      >
        {loading ? <><Loader2 className="animate-spin" size={18} /><span>Sécurisation...</span></> : "Confirmer la commande"}
      </button>
    </div>
  );
}
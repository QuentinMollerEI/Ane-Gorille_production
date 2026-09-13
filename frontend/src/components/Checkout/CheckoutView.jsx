// src/pages/Checkout/CheckoutView.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function CheckoutView({ cartItems, clearCart }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Données saisies par l'acheteur
  const [checkoutOptions, setCheckoutOptions] = useState({
    deliveryAddress: user?.address || "",
    refEngagement: user?.defaultEngagement || "" // Essentiel pour le B2G (Chorus Pro)
  });

  const handleValidateOrder = async () => {
    setLoading(true);
    setError("");
    
    try {
      // 1 seul appel propre vers l'Orchestrateur
      const result = await CheckoutOrchestrator.processCheckout(user, cartItems, checkoutOptions);
      
      if (result.success) {
        setSuccess(true);
        clearCart();
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de la validation de la commande.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-12 bg-emerald-50 rounded-2xl border border-emerald-200">
        <ShieldCheck size={48} className="mx-auto text-emerald-600 mb-4" />
        <h2 className="text-2xl font-black text-emerald-900">Commande validée avec succès !</h2>
        <p className="text-emerald-800 mt-2">Les bons de préparation ont été transmis aux maraîchers.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-black text-gray-900 mb-4">Validation de la commande</h2>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Formulaire optionnel selon le profil (B2G demande l'engagement Chorus Pro) */}
      {user?.role === "acheteur_public" && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">N° d'Engagement Budgétaire (Obligatoire Chorus Pro)</label>
          <input 
            type="text" 
            value={checkoutOptions.refEngagement}
            onChange={e => setCheckoutOptions(prev => ({...prev, refEngagement: e.target.value}))}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            placeholder="Ex: ENG-2026-908"
          />
        </div>
      )}

      <button 
        onClick={handleValidateOrder} 
        disabled={loading || cartItems.length === 0}
        className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Confirmer et Payer la commande"}
      </button>
    </div>
  );
}
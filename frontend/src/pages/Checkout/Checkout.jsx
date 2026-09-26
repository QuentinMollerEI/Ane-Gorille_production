import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { processCheckoutOrder } from "../../services/CheckoutOrchestrator.js";

import { OrderSummary } from "./components/OrderSummary.jsx";
import { ChorusProForm } from "./components/ChorusProForm.jsx";
import { StripePaymentForm } from "./components/StripePaymentForm.jsx";

import { Store, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const { cart, calculateTotals, clearCart } = useCart();

  const currentUser = userProfile || user || {};
  const isB2G = currentUser.role === "acheteur_public";

  const [refEngagement, setRefEngagement] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const totals = calculateTotals();

  const handleProcessOrder = async () => {
    setError("");

    if (!cart || cart.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    if (!totals.meetsMinimumOrder) {
      setError("Le montant minimum de commande est de 50,00 € HT.");
      return;
    }

    if (isB2G && !refEngagement.trim()) {
      setError("Pour le secteur public (B2G), le numéro d'engagement budgétaire Chorus Pro est obligatoire.");
      return;
    }

    setIsProcessing(true);

    try {
      const orderResult = await processCheckoutOrder({
        buyerUser: currentUser,
        cartItems: cart,
        shippingOption: "STANDARD_50KM",
        refEngagement: isB2G ? refEngagement.trim() : null,
        serviceCode: isB2G ? serviceCode.trim() : null
      });

      clearCart();
      navigate(`/dashboard?module=commandes&success=1&orderId=${orderResult.masterOrderId}`);
    } catch (err) {
      console.error("Erreur lors de la validation de commande :", err);
      setError(err.message || "Échec du traitement de la commande.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4">
        <Store size={40} className="text-slate-400 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Votre panier est actuellement vide</h2>
        <p className="text-xs text-slate-500">Ajoutez des produits frais ou artisanaux du catalogue pour passer commande.</p>
        <button
          onClick={() => navigate("/dashboard?module=boutique")}
          className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Store className="text-emerald-700" size={28} />
            Validation de Commande
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Achat Direct Producteurs & Artisans — Périmètre 50 km autour de Saint-Rémy-sur-Avre
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard?module=boutique")}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour Panier
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderSummary cart={cart} totals={totals} isB2G={isB2G} />

        <div className="space-y-6">
          {isB2G ? (
            <div className="space-y-4">
              <ChorusProForm
                refEngagement={refEngagement}
                onRefEngagementChange={setRefEngagement}
                serviceCode={serviceCode}
                onServiceCodeChange={setServiceCode}
                siretPublic={currentUser.siret}
                isValid={!!refEngagement.trim()}
              />

              <button
                type="button"
                onClick={handleProcessOrder}
                disabled={isProcessing || !refEngagement.trim() || !totals.meetsMinimumOrder}
                className="w-full py-4 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={18} />
                <span>Valider la Commande Publique (Chorus Pro)</span>
              </button>
            </div>
          ) : (
            <StripePaymentForm
              totalTTC={totals.totalTTC}
              onSubmitPayment={handleProcessOrder}
              isProcessing={isProcessing}
              disabled={!totals.meetsMinimumOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
}
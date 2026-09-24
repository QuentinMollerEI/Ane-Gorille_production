import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { TaxAndFeeCalculator } from "../../utils/TaxAndFeeCalculator";
import { ShieldCheck, Loader2, Lock, AlertTriangle } from "lucide-react";

// Chargement sécurisé de la clé publique Stripe depuis l'environnement Vite
const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const defaultStripePromise = (typeof rawStripeKey === "string" && rawStripeKey.trim().length > 0)
  ? loadStripe(rawStripeKey.trim())
  : null;

function CardFormInner({ cartItems = [], isProcessing, onSubmitOrder, totals }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);

  // Sécurisation des montants
  const displayTotalTTC = totals.grandTotalTTC ? totals.grandTotalTTC.toFixed(2) : "0.00";
  const displayProductsHT = totals.itemsTotalHT ? totals.itemsTotalHT.toFixed(2) : "0.00";
  const displayProductsVAT = totals.itemsVAT ? totals.itemsVAT.toFixed(2) : "0.00";
  const displayShippingHT = totals.shippingFeeHT === 0 ? "0.00 (FRANCO)" : (totals.shippingFeeHT ? totals.shippingFeeHT.toFixed(2) + " €" : "15.00 €");
  const displayShippingVAT = totals.shippingVAT ? totals.shippingVAT.toFixed(2) : "3.00";

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setCardError(null);

    if (!stripe || !elements) {
      setCardError("Le module de paiement Stripe est en cours d'initialisation.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError("Veuillez renseigner les coordonnées de votre carte bancaire.");
      return;
    }

    if (onSubmitOrder) {
      onSubmitOrder({ stripe, elements, cardElement });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif Financier Certifié */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-sans text-slate-700">
        <div className="flex justify-between items-center text-slate-600">
          <span>Sous-total Produits HT :</span>
          <span className="font-mono font-bold">{displayProductsHT} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Alimentaire (5.5%) :</span>
          <span className="font-mono font-bold">{displayProductsVAT} €</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
          <span>Frais de Port B2B (Dégressifs) :</span>
          <span className="font-mono font-bold text-amber-900">{displayShippingHT}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>TVA Transport (20.0%) :</span>
          <span className="font-mono font-bold">{displayShippingVAT} €</span>
        </div>

        <div className="flex justify-between items-center text-slate-900 font-black text-sm pt-2 border-t border-slate-300">
          <span>Montant Total à Régler TTC :</span>
          <span className="font-mono text-emerald-700 text-base">{displayTotalTTC} € TTC</span>
        </div>
      </div>

      {/* Saisie de Carte Sécurisée */}
      <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <Lock size={13} className="text-emerald-700" />
          Coordonnées de Carte Bancaire (Paiement Sécurisé SSL)
        </label>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#0f172a",
                  fontFamily: "sans-serif",
                  "::placeholder": { color: "#94a3b8" },
                },
                invalid: { color: "#dc2626" },
              },
            }}
            onChange={(e) => setCardError(e.error ? e.error.message : null)}
          />
        </div>
      </div>

      {cardError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs">
          ⚠️ {cardError}
        </div>
      )}

      {/* Bouton de Paiement avec le Prix TTC */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || cartItems.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {isProcessing
            ? "Traitement sécurisé en cours..."
            : `Payer Maintenant par Carte (${displayTotalTTC} € TTC)`}
        </span>
      </button>
    </form>
  );
}

export default function StripeCardForm(props) {
  const activePromise = props.stripePromise || defaultStripePromise;
  const totals = TaxAndFeeCalculator.computeOrderTotals(props.cartItems || []);

  if (!activePromise) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950">
        <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
          <AlertTriangle className="text-amber-600 shrink-0" size={16} />
          <span>Clé Publique Stripe non Définie</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          Renseignez <code>VITE_STRIPE_PUBLIC_KEY=pk_test_...</code> dans votre fichier <code>frontend/.env</code> pour activer la saisie par carte.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={activePromise}>
      <CardFormInner {...props} totals={totals} />
    </Elements>
  );
}

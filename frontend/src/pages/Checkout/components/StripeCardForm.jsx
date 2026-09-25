import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export default function StripeCardForm({ isProcessing, onSubmitOrder, totals }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);

  const displayTotalTTC = totals?.grandTotalTTC ? Number(totals.grandTotalTTC).toFixed(2) : "22.85";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCardError(null);

    if (!stripe || !elements) {
      setCardError("Le module de paiement Stripe est en cours d'initialisation. Veuillez repatienter un instant.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError("Veuillez renseigner les coordonnées de votre carte bancaire de test.");
      return;
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement
    });

    if (stripeError) {
      setCardError(stripeError.message);
      return;
    }

    if (onSubmitOrder) {
      onSubmitOrder({ paymentMethodId: paymentMethod.id });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
          <Lock size={14} className="text-emerald-700" />
          Carte Bancaire (Mode Test Stripe)
        </label>
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
          iFrame CB Active
        </span>
      </div>

      <div className="bg-white border-2 border-emerald-600 rounded-xl p-4 shadow-sm min-h-[50px]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "15px",
                color: "#0f172a",
                fontFamily: "system-ui, -apple-system, sans-serif",
                "::placeholder": { color: "#94a3b8" }
              },
              invalid: { color: "#dc2626" }
            }
          }}
          onChange={(e) => setCardError(e.error ? e.error.message : null)}
        />
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
        <span className="font-bold text-amber-700 shrink-0">💳 Carte Test :</span>
        <p className="font-mono text-[11px]">
          Saisissez <strong>4242 4242 4242 4242</strong> | Expiration future | CVC <strong>123</strong>.
        </p>
      </div>

      {cardError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{cardError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span>Traitement du Paiement Stripe...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Payer Maintenant par Carte ({displayTotalTTC} € TTC)</span>
          </>
        )}
      </button>
    </form>
  );
}
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck, Loader2, X, AlertTriangle } from "lucide-react";

// 🎯 Initialisation unique de Stripe.js via la clé publique Vite
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * 🔒 Formulaire interne de saisie IBAN & Signature du Mandat
 */
function SepaFormContent({ onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmitMandate = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg(null);

    // 🎯 Confirmation du SetupIntent auprès de Stripe
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("[SEPA CONFIRM ERROR] :", error);
      setErrorMsg(error.message || "Impossible de valider le mandat SEPA.");
      setIsProcessing(false);
    } else if (setupIntent && setupIntent.status === "succeeded") {
      console.log("[SEPA MANDAT VALIDÉ] SetupIntent ID :", setupIntent.id);
      setIsProcessing(false);
      onSuccess(setupIntent);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmitMandate} className="space-y-5">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Saisie sécurisée IBAN gérée directement par Stripe Elements */}
      <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50">
        <PaymentElement />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enregistrement du Mandat...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Signer le Mandat SEPA</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * 💳 Modal Principale enveloppée dans le composant Elements de Stripe
 */
export default function SepaMandateModal({ clientSecret, onClose, onSuccess }) {
  if (!clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-base">
              Mandat de Prélèvement SEPA B2B
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Prélèvement sécurisé régi par le Code Monétaire et Financier.
            </p>
          </div>
        </div>

        {/* Injection du contexte Stripe Elements avec le clientSecret */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SepaFormContent onClose={onClose} onSuccess={onSuccess} />
        </Elements>
      </div>
    </div>
  );
}

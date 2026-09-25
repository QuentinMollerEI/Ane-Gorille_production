import CheckoutView from "../Checkout/components/CheckoutView.jsx";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// 1. Récupération dynamique de la clé d'environnement Vite
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// 2. Initialisation sécurisée
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

export default function SepaMandateModal({ clientSecret, onClose, onSuccess }) {
  if (!stripePublishableKey) {
    console.error(
      "[STRIPE ERROR] : La variable VITE_STRIPE_PUBLISHABLE_KEY est manquante dans votre fichier frontend/.env"
    );
  }

  return (
    /* Conteneur d'arrière-plan avec défilement global et espacement responsive (p-4 sm:p-6) */
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      
      {/* Carte Pop-up avec hauteur maximale (90vh) et défilement interne (overflow-y-auto) */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 relative my-auto">
        
        {stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SepaMandateForm onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        ) : (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold space-y-2">
            <p className="font-bold text-sm">Configuration Stripe manquante</p>
            <p className="text-[11px] leading-relaxed">
              La clé publique d'API est introuvable dans votre fichier <code className="bg-red-100 px-1 py-0.5 rounded font-mono">frontend/.env</code> (<code className="font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code>).
            </p>
            <button
              onClick={onClose}
              type="button"
              className="mt-2 w-full py-2 bg-red-200 hover:bg-red-300 text-red-900 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sous-composant du Formulaire SEPA
 */
function SepaMandateForm({ onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage("");

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?sepa=success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      <div>
        <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
          Mandat de Prélèvement SEPA B2B
        </h3>
        <p className="text-gray-500 font-medium text-[11px] sm:text-xs mt-1">
          Saisissez les coordonnées bancaires de votre structure. La saisie est sécurisée directement par Stripe.
        </p>
      </div>

      {/* Conteneur d'élément Stripe réactif */}
      <div className="p-1 min-h-[180px]">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl font-semibold text-[11px] leading-relaxed">
          {errorMessage}
        </div>
      )}

      {/* Boutons d'action adaptés aux petits écrans */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-1/2 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-center"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full sm:w-1/2 py-3 bg-emerald-800 text-white font-extrabold rounded-xl hover:bg-emerald-900 disabled:bg-gray-300 transition-colors cursor-pointer text-center shadow-sm"
        >
          {loading ? "Validation en cours..." : "Signer le mandat"}
        </button>
      </div>
    </form>
  );
}
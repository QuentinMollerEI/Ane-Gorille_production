import React, { useState } from "react";
import { useStripe, useElements, IbanElement } from "@stripe/react-stripe-js";
import * as paymentService from "../../../../services/paymentService";
import { ShieldCheck, Loader2, Lock } from "lucide-react";

export default function SepaMandateForm({ userId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      const session = await paymentService.initSepaSetupIntent();
      const ibanElement = elements.getElement(IbanElement);

      const result = await stripe.confirmSepaDebitSetup(session.clientSecret, {
        payment_method: {
          sepa_debit: ibanElement,
          billing_details: { name, email },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        onSuccess(result.setupIntent);
      }
    } catch (err) {
      setError("La connexion au terminal de paiement a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-2 text-blue-900 mb-2">
        <Lock size={16} className="shrink-0 mt-0.5" />
        <p className="font-medium text-[11px] leading-relaxed">
          Saisie isolée sous iFrame certifiée PCI-DSS de niveau 1. La
          transaction est directement traitée par Stripe Connect. Aucun IBAN
          n'est stocké chez nous.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1.5">
            Identité juridique du titulaire du compte *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Raison sociale de l'entreprise"
            className="w-full p-3 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1.5">
            E-mail du service comptabilité *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="comptabilite@votre-entreprise.fr"
            className="w-full p-3 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block font-bold text-gray-700">
          Numéro IBAN de l'entreprise *
        </label>
        <div className="p-3.5 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-emerald-500 shadow-sm">
          <IbanElement
            options={{
              supportedCountries: ["SEPA"],
              style: {
                base: {
                  fontSize: "13px",
                  color: "#111827",
                  "::placeholder": { color: "#9CA3AF" },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-bold text-[11px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl uppercase flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {loading ? "Chiffrement en cours..." : "Valider le Mandat SEPA"}
        </span>
      </button>
    </form>
  );
}

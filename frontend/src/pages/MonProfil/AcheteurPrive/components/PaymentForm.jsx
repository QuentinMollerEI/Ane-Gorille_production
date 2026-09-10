import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  IbanElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { paymentService } from "../../../../services/paymentService";
import {
  CreditCard,
  Building,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";

// Initialisation de Stripe avec la clé publique du projet
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_sample",
);

function SepaFormInner({ userId, onSuccess }) {
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
      // 1. Obtention du clientSecret depuis la Cloud Function via paymentService
      const session = await paymentService.initMandateSession(
        userId,
        "stripe_sepa",
      );

      // 2. Confirmation du SetupIntent SEPA avec l'iFrame IbanElement
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
      console.error("Erreur SEPA :", err);
      setError(err.message || "Impossible de valider le mandat SEPA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Titulaire du Compte :
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Raison Sociale / Nom"
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            E-mail de Notification SEPA :
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="comptabilite@etablissement.fr"
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-gray-700">
          Saisie IBAN (Sécurisée via Stripe) :
        </label>
        <div className="p-3 border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-emerald-500">
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

      {error && <p className="text-red-600 font-bold text-[11px]">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>
          {loading ? "Validation en cours..." : "Valider le Mandat SEPA"}
        </span>
      </button>
    </form>
  );
}

export default function PaymentForm({ userId }) {
  const [activeTab, setActiveTab] = useState("stripe_sepa"); // "stripe_sepa" | "bank_transfer"
  const [setupSuccess, setSetupSuccess] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Moyen de Paiement Professionnel
          </h3>
          <p className="text-gray-500 font-medium">
            Choisissez votre mode de règlement B2B/B2G.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("stripe_sepa")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === "stripe_sepa"
                ? "bg-emerald-800 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Prélèvement SEPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank_transfer")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === "bank_transfer"
                ? "bg-emerald-800 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Virement Bancaire
          </button>
        </div>
      </div>

      {activeTab === "stripe_sepa" && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-2 text-gray-600">
            <Lock size={16} className="text-emerald-700 shrink-0" />
            <span>
              Saisie isolée sous iFrame certifiée PCI-DSS. Aucun IBAN n'est
              stocké chez nous.
            </span>
          </div>

          {setupSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <span>Mandat SEPA configuré et actif avec succès !</span>
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <SepaFormInner
                userId={userId}
                onSuccess={() => setSetupSuccess(true)}
              />
            </Elements>
          )}
        </div>
      )}

      {activeTab === "bank_transfer" && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-blue-950 font-extrabold">
            <Building size={18} className="text-blue-700" />
            <span>
              Paiement par Virement Bancaire à Réception de Bon de Commande
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed font-medium">
            En choisissant ce mode, vos commandes généreront immédiatement un{" "}
            <strong>Bon de Commande officiel</strong>. Les marchandises seront
            réservées à la récolte et expédiées à réception des fonds sur le
            compte séquestre.
          </p>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Landmark, CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * 🧑‍🌾 COMPOSANT : StripeConnectForm.jsx
 * Emplacement : src/pages/MonProfil/Producteur/components/StripeConnectForm.jsx
 * Responsabilité unique : Gérer la configuration financière Stripe Connect Express du Maraîcher.
 */
export default function StripeConnectForm({ profileData, onChange, errors }) {
  const isConnected = Boolean(profileData?.stripeAccountId);

  return (
    <div className="bg-amber-50/40 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5 border-b border-amber-200 pb-3">
        <Landmark size={16} className="text-amber-700" /> Raccordement de
        Versement (Stripe Connect Express)
      </h3>

      <div className="text-xs space-y-3 font-medium text-amber-950 leading-relaxed">
        <p>
          🔒 <strong>Séparation et conformité ACPR / DSP2 :</strong> Les ventes
          de vos légumes sur la marketplace d'Âne & Gorille transitent de
          manière sécurisée par un{" "}
          <strong>compte séquestre Stripe Connect</strong>. Les fonds sont
          automatiquement splittés et versés sur votre compte bancaire sans que
          la plateforme ne manipule directement votre argent.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-amber-200 p-5 rounded-2xl justify-between shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-black text-gray-900 uppercase flex items-center gap-1.5 justify-center sm:justify-start">
              {isConnected ? (
                <>
                  <CheckCircle2 className="text-green-600" size={16} />
                  <span>Compte Stripe Raccordé</span>
                </>
              ) : (
                <>
                  <ShieldAlert
                    className="text-amber-600 animate-pulse"
                    size={16}
                  />
                  <span>Connexion Financière Requise</span>
                </>
              )}
            </p>
            <p className="text-[10px] text-gray-500 font-bold font-mono">
              {isConnected
                ? `ID STRIPE : ${profileData?.stripeAccountId}`
                : "Saisissez votre ID Stripe ou connectez votre RIB"}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={profileData?.stripeAccountId || ""}
              onChange={(e) =>
                onChange("stripeAccountId", e.target.value.trim())
              }
              className="p-2.5 border border-amber-200 rounded-xl font-mono text-[10px] focus:ring-1 focus:ring-amber-600 focus:outline-none bg-white w-full sm:w-44 text-center"
              placeholder="Ex : acct_1N2345..."
            />
          </div>
        </div>
        {errors?.stripeAccountId && (
          <p className="text-red-600 text-[10px] font-bold">
            {errors.stripeAccountId}
          </p>
        )}
      </div>
    </div>
  );
}

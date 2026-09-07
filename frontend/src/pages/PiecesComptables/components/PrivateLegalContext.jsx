import React, { useState } from "react";
import { ChevronUp, ChevronDown, ShieldCheck } from "lucide-react";

export default function PrivateLegalContext() {
  const [isRetracted, setIsRetracted] = useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          Paiement Sécurisé & Transparence B2B/B2C
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:bg-gray-100 p-1 rounded"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 bg-white text-sm text-gray-700 rounded-b-xl space-y-4">
          <p>
            <strong>Code de Commerce :</strong> Les pièces générées détaillent
            l'identité des producteurs tiers et les montants de TVA pour votre
            tenue comptable[cite: 2, 8].
          </p>
          <p>
            <strong>Fonds Séquestrés :</strong> Les paiements par carte bancaire
            sont sécurisés par Stripe. La plateforme n'encaisse jamais les fonds
            directement pour le compte des vendeurs[cite: 1, 8].
          </p>
        </div>
      )}
    </div>
  );
}

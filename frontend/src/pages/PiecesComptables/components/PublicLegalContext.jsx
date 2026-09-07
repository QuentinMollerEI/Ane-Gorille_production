import React, { useState } from "react";
import { ChevronUp, ChevronDown, Scale } from "lucide-react";

export default function PublicLegalContext() {
  const [isRetracted, setIsRetracted] = useState(true);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Scale size={18} className="text-emerald-600" />
          Cadre Juridique et Conformité B2G
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
            <strong>Loi LME :</strong> Le délai de paiement applicable à la
            commande publique est fixé à 30 jours maximum après réception de la
            facture[cite: 1, 8].
          </p>
          <p>
            <strong>Loi EGAlim :</strong> Les justificatifs téléchargés ici
            prouvent vos achats durables (50% de qualité, dont 20% bio) pour vos
            déclarations annuelles.
          </p>
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg text-xs">
            Vos identifiants de télétransmission (SIRET, Code Service) sont
            désormais gérés dans l'onglet <strong>Mon Profil</strong>[cite: 1,
            2].
          </div>
        </div>
      )}
    </div>
  );
}

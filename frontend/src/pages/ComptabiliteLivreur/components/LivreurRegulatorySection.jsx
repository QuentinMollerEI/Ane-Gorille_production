import React, { useState } from "react";
import {
  FileCheck,
  Award,
  Shield,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * 🛡️ COMPOSANT COMPORTEMENTAL : LivreurRegulatorySection.jsx
 * Responsabilité unique : Présenter les documents de conformité légale et habilitations DREAL
 * requises pour la livraison de fret de proximité.
 */
export default function LivreurRegulatorySection() {
  const [isRetracted, setIsRetracted] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileCheck size={18} className="text-emerald-600" />
          3. Réglementation DREAL, Assurances & Conformité de Fret
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* DREAL Licences */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={15} /> Licences Professionnelles de Transport
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pour pouvoir livrer les collectivités publiques et entreprises
              tierces de la plateforme, votre licence de transport routier de
              marchandises (DREAL) doit être tenue à jour.
            </p>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-green-950">
                  Licence N° 2026-L-123456
                </p>
                <p className="text-[10px] text-green-700 font-medium">
                  Validité certifiée jusqu'au 31/12/2026
                </p>
              </div>
              <span className="p-1 bg-green-500 text-white rounded-full">
                <CheckCircle size={14} />
              </span>
            </div>
            <button className="text-xs font-bold text-emerald-700 hover:underline">
              Téléverser un nouveau renouvellement d'habilitation
            </button>
          </div>

          {/* Fret and Cold Chain Insurance */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={15} /> Assurances du Fret & Chaîne du Froid
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vos justificatifs de couverture responsabilité civile
              professionnelle (RC Pro Transport) garantissent l'indemnisation
              des denrées alimentaires fraîches en cas de rupture accidentelle
              de température.
            </p>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-green-950">
                  Attestation d'Assurance Fret Alimentaire
                </p>
                <p className="text-[10px] text-green-700 font-medium">
                  Couverture RC Pro valide (Axa Flotte Pro)
                </p>
              </div>
              <span className="p-1 bg-green-500 text-white rounded-full">
                <CheckCircle size={14} />
              </span>
            </div>
            <button className="text-xs font-bold text-emerald-700 hover:underline">
              Consulter les détails du contrat de garantie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

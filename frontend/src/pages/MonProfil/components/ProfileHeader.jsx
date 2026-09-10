import React from "react";
import { ShieldCheck, AlertTriangle, Building2 } from "lucide-react";

/**
 * 🔒 SOUS-COMPOSANT : ProfileHeader.jsx
 * Emplacement : src/pages/MonProfil/components/ProfileHeader.jsx
 * Affiche l'en-tête de l'espace profil et le badge de conformité 100%.
 */
export default function ProfileHeader({ roleLabel, isComplete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          {roleLabel || "Espace Profil Professionnel"}
        </h2>

        {/* BADGE VISUEL DYNAMIQUE DE COMPLÉTUDE */}
        {isComplete ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-extrabold text-xs">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>Profil vérifié & conforme à 100% (Prêt pour commander)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-extrabold text-xs animate-pulse">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Informations Incomplètes</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl self-start sm:self-auto">
        <Building2 size={24} />
      </div>
    </div>
  );
}

import React from "react";
import { Leaf } from "lucide-react";

export default function EgalimBadgesSelector({ formData, handleChange }) {
  const badges = [
    { id: "Aucun", label: "Aucun Badge" },
    { id: "Bio (AB)", label: "🌱 Agriculture Biologique (AB)" },
    { id: "HVE", label: "🌿 Haute Valeur Environnementale (HVE)" },
    { id: "Produit Local", label: "🚜 Circuit Court / Produit Local" },
    { id: "AOP / AOC", label: "🏅 Appellation d'Origine (AOP/AOC)" }
  ];

  return (
    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Leaf size={16} className="text-emerald-600" />
        Certification & Label EGaLim
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {badges.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleChange({ target: { name: "egalimBadge", value: b.id } })}
            className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
              formData.egalimBadge === b.id
                ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
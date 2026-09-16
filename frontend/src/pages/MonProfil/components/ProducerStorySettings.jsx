import React from "react";
import { Info, CheckCircle, Leaf } from "lucide-react";

export default function ProducerStorySettings({ profile = {} }) {
  const description =
    profile.description ||
    profile.bio ||
    profile.presentation ||
    profile.story ||
    "Exploitant agricole partenaire engagé dans la distribution alimentaire en circuit court et la traçabilité sanitaire.";

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
          <Info size={16} className="text-emerald-700" />
          <span>Histoire & Présentation de l'exploitation</span>
        </h3>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <Leaf size={12} className="text-emerald-600" />
          <span>Circuit Court Certifié</span>
        </span>
      </div>

      {/* TEXTE DE PRÉSENTATION DE L'EXPLOITATION */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
        <p className="text-gray-700 font-medium leading-relaxed text-xs whitespace-pre-line">
          {description}
        </p>
      </div>

      {/* ENGAGEMENTS SÉCURITÉ ALIMENTAIRE ET QUALITÉ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-gray-800 text-[11px]">Récolte fraîche sur commande</span>
        </div>
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-gray-800 text-[11px]">Normes HACCP & Hygiène</span>
        </div>
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-gray-800 text-[11px]">Livraison chaîne du froid</span>
        </div>
      </div>
    </div>
  );
}
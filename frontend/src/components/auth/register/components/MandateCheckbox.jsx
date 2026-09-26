import React from "react";
import { FileCheck } from "lucide-react";

export function MandateCheckbox({ acceptTerms, onToggleTerms }) {
  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-2">
      <div className="flex items-start gap-2">
        <FileCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Mandat de Facturation Transparent (Art. 289-I-2 du CGI) & RGPD :</p>
          <p className="text-amber-800 leading-tight">
            Vous autorisez Âne & Gorille à générer les factures au nom et pour le compte de votre structure et acceptez la conservation sécurisée des données de facturation.
          </p>
        </div>
      </div>
      <label className="flex items-center gap-2 pt-1 font-bold cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={onToggleTerms}
          className="accent-emerald-700 w-4 h-4"
        />
        <span>J'accepte le mandat de facturation et la politique des données.</span>
      </label>
    </div>
  );
}
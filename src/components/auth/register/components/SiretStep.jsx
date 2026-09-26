import React from "react";
import { Building2, CheckCircle2, Lock, Loader2, Search } from "lucide-react";

export function SiretStep({
  siret,
  onSiretChange,
  onVerifySiret,
  verifyingSiret,
  siretVerified,
  companyName,
  onCompanyNameChange
}) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <label className="text-[11px] font-black text-slate-800 uppercase flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Building2 size={16} className="text-emerald-700" />
          1. Identification SIRET (Obligatoire) *
        </span>
        {siretVerified ? (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
            <CheckCircle2 size={12} /> SIRET Validé
          </span>
        ) : (
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Lock size={12} /> Vérification Requise
          </span>
        )}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={14}
          value={siret}
          onChange={onSiretChange}
          placeholder="SIRET (14 chiffres)"
          required
          className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={onVerifySiret}
          disabled={verifyingSiret || siret.replace(/\s/g, "").length < 14}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {verifyingSiret ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          <span>Vérifier SIRET</span>
        </button>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
          Raison Sociale Officielle (SIRENE)
        </label>
        <input
          type="text"
          required
          readOnly={siretVerified}
          value={companyName}
          onChange={onCompanyNameChange}
          placeholder="Raison sociale importée automatiquement"
          className={`w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none ${
            siretVerified ? "bg-slate-100 cursor-not-allowed" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}
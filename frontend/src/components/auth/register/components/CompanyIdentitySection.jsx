import React from "react";
import { Building2, Search, CheckCircle2 } from "lucide-react";

export default function CompanyIdentitySection({ siret, setSiret, onSearch, loading, companyInfo, error }) {
  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Building2 size={16} className="text-emerald-600" />
        Vérification SIRET & Raison Sociale
      </h4>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-700 uppercase">Numéro SIRET (14 chiffres) *</label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={14}
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            placeholder="Ex: 90000000000000"
            className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="button"
            onClick={() => onSearch(siret)}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search size={14} />
            {loading ? "Vérification..." : "Vérifier"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

      {companyInfo && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-900">
          <p className="font-black flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-600" />
            {companyInfo.companyName}
          </p>
          <p className="text-[11px] text-emerald-700">{companyInfo.address}</p>
        </div>
      )}
    </div>
  );
}
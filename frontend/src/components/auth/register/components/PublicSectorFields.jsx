import React from "react";
import { Landmark } from "lucide-react";

export default function PublicSectorFields({ formData, handleChange }) {
  return (
    <div className="space-y-3 bg-amber-50 p-5 rounded-2xl border border-amber-200">
      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
        <Landmark size={16} className="text-amber-700" />
        Configuration Compte Public Chorus Pro (B2G)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-900 uppercase">Code Service Exécutant</label>
          <input
            type="text"
            name="serviceCode"
            value={formData.serviceCode || ""}
            onChange={handleChange}
            placeholder="Ex: SERV-CUISINE-CENTRALE"
            className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-900 uppercase">Référence Engagement Défaut</label>
          <input
            type="text"
            name="defaultRefEngagement"
            value={formData.defaultRefEngagement || ""}
            onChange={handleChange}
            placeholder="Ex: ENG-2026-900"
            className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
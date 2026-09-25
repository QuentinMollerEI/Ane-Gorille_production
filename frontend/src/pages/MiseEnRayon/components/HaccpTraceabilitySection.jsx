import React from "react";
import { ShieldCheck, Calendar, Thermometer } from "lucide-react";

export default function HaccpTraceabilitySection({ formData, handleChange }) {
  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-600" />
        Traçabilité Sanitaire & HACCP
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Numéro de Lot HACCP *</label>
          <input
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
            placeholder="Ex: L-2026-901"
            required
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
            <Calendar size={12} /> DLC / DLUO
          </label>
          <input
            type="date"
            name="dlc"
            value={formData.dlc}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
            <Thermometer size={12} /> Conservation
          </label>
          <select
            name="storageTemp"
            value={formData.storageTemp}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="10°C - 15°C">10°C - 15°C (Léger frais / Maraîchage)</option>
            <option value="2°C - 4°C">2°C - 4°C (Produits Frais / Sensibles)</option>
            <option value="Ambiant">Ambiant (Sec / Épicerie / Artisanat)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
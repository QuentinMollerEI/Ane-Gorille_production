import React from "react";
import { Activity, ShieldCheck, Scale } from "lucide-react";

export default function PlatformMetrics() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <Activity className="text-rose-700" size={18} />
        <span>Indicateurs de Conformité & Séquestre PSP</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
          <span className="text-gray-500 font-bold text-[10px] uppercase">
            Ventilation Stripe
          </span>
          <p className="text-sm font-black text-gray-900">
            82% Producteur / 18% Hub
          </p>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
          <span className="text-gray-500 font-bold text-[10px] uppercase">
            Paiements Publics Chorus
          </span>
          <p className="text-sm font-black text-emerald-800 flex items-center gap-1">
            <ShieldCheck size={14} />
            <span>Mandat 30j LME</span>
          </p>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
          <span className="text-gray-500 font-bold text-[10px] uppercase">
            Réglementation RGPD
          </span>
          <p className="text-sm font-black text-gray-900 flex items-center gap-1">
            <Scale size={14} className="text-rose-700" />
            <span>Serveurs Paris (GCP)</span>
          </p>
        </div>
      </div>
    </div>
  );
}

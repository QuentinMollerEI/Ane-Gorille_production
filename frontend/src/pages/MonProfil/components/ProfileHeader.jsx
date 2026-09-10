import React from "react";
import { User, ShieldCheck, AlertTriangle } from "lucide-react";

export default function ProfileHeader({ roleLabel, isComplete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Mon Profil & Facturation
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            {roleLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isComplete ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 font-black text-[11px] uppercase rounded-full border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Profil Conforme</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 font-black text-[11px] uppercase rounded-full border border-amber-200">
            <AlertTriangle size={14} className="text-amber-700" />
            <span>Informations Incomplètes</span>
          </span>
        )}
      </div>
    </div>
  );
}

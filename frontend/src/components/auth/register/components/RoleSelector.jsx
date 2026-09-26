import React from "react";
import { ROLES_CONFIG } from "../constants.js";

export function RoleSelector({ selectedRole, onSelectRole }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
        Profil d'Activité Professionnelle *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLES_CONFIG.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className={`p-3.5 rounded-2xl border-2 text-left text-xs transition-all cursor-pointer ${
              role.fullWidth ? "sm:col-span-2" : ""
            } ${
              selectedRole === role.id
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm"
                : "border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <p className="font-bold">{role.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{role.subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
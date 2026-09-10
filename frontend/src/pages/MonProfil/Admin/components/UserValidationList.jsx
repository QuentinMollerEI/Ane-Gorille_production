import React from "react";
import { Users, CheckCircle2, ShieldAlert } from "lucide-react";

export default function UserValidationList() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <Users className="text-rose-700 shrink-0" size={20} />
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">
              Supervision & Validation des Inscriptions
            </h3>
            <p className="text-gray-500 font-medium">
              Contrôle des pièces KBIS, SIRET et comptes Stripe Connect.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-950 font-bold">
          <CheckCircle2 size={18} className="text-rose-600 shrink-0" />
          <span>
            Tous les comptes acheteurs et producteurs enregistrés sont
            conformes.
          </span>
        </div>
        <span className="text-[10px] bg-rose-200 text-rose-900 font-black px-2 py-0.5 rounded-md">
          0 EN ATTENTE
        </span>
      </div>
    </div>
  );
}

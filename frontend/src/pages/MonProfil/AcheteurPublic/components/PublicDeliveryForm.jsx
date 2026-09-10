import React, { useState } from "react";
import { Building, Info } from "lucide-react";

export default function PublicDeliveryForm() {
  const [accessRules, setAccessRules] = useState("");

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <Building className="text-blue-700" size={18} />
        <span>Spécificités Livraison Collectivité / Cantine Scolaire</span>
      </h3>

      <div className="space-y-1">
        <label className="font-bold text-gray-700 flex items-center gap-1.5">
          <Info size={14} className="text-blue-700" />
          <span>
            Consignes d'accès établissement (Protocole de sécurité / Badge) :
          </span>
        </label>
        <textarea
          rows={3}
          placeholder="ex: Présentation à la loge gardien, accès cour d'école uniquement entre 07:00 et 08:00."
          value={accessRules}
          onChange={(e) => setAccessRules(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Sprout, Clock } from "lucide-react";

export default function HarvestLogisticsForm() {
  const [cutoffTime, setCutoffTime] = useState("18:00");
  const [crateType, setCrateType] = useState("IFCO Standard");

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <Sprout className="text-emerald-700" size={18} />
        <span>Contraintes de Récolte & Préparation des Commandes</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-gray-700 flex items-center gap-1">
            <Clock size={14} className="text-emerald-700" />
            <span>Heure limite de commande pour préparation J+1 :</span>
          </label>
          <select
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="16:00">16:00 (Récolte du soir)</option>
            <option value="18:00">18:00 (Standard)</option>
            <option value="20:00">
              20:00 (Récolte ultra-fraîche du matin)
            </option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Format de conditionnement / Cagettes consignées :
          </label>
          <input
            type="text"
            value={crateType}
            onChange={(e) => setCrateType(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

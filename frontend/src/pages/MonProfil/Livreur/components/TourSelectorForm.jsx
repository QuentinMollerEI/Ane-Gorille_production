import React, { useState } from "react";
import { MapPin, Calendar } from "lucide-react";

export default function TourSelectorForm() {
  const [zone, setZone] = useState(
    "Zone Nord / Hub Principal (Périmètre 30km)",
  );

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <MapPin className="text-purple-700" size={18} />
        <span>Secteur de Ramassage & Tournées Attribuées</span>
      </h3>

      <div className="space-y-1">
        <label className="font-bold text-gray-700 flex items-center gap-1.5">
          <Calendar size={14} className="text-purple-700" />
          <span>Zone de collecte privilégiée :</span>
        </label>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="Zone Nord / Hub Principal (Périmètre 30km)">
            Zone Nord / Hub Principal (30km radius)
          </option>
          <option value="Zone Sud / Ceinture Maraîchère">
            Zone Sud / Ceinture Maraîchère
          </option>
          <option value="Axe Collectivités / Écoles">
            Axe Collectivités / Écoles
          </option>
        </select>
      </div>
    </div>
  );
}

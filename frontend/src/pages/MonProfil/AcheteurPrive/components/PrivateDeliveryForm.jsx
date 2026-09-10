import React, { useState } from "react";
import { Truck, Clock } from "lucide-react";

export default function PrivateDeliveryForm() {
  const [deliveryWindow, setDeliveryWindow] = useState("06:00 - 10:00");
  const [instructions, setInstructions] = useState("");

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <Truck className="text-emerald-700" size={18} />
        <span>Spécificités de Livraison B2B / Restauration</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-gray-700 flex items-center gap-1.5">
            <Clock size={14} className="text-emerald-700" />
            <span>Créneau de réception privilégié :</span>
          </label>
          <select
            value={deliveryWindow}
            onChange={(e) => setDeliveryWindow(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="06:00 - 08:00">
              06:00 - 08:00 (Avant service du midi)
            </option>
            <option value="08:00 - 10:00">08:00 - 10:00 (Matinée)</option>
            <option value="14:00 - 16:00">14:00 - 16:00 (Après-midi)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Instructions pour le livreur (Accès / Quai) :
          </label>
          <input
            type="text"
            placeholder="ex: Entrée quai de déchargement rue arrière, sonner en cuisine"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

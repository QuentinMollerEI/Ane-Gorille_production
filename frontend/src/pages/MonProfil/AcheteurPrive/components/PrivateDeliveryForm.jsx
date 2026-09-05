import React from "react";
import { Truck } from "lucide-react";

export default function PrivateDeliveryForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Truck size={16} className="text-green-700" /> Adresse et Conditions de
        Livraison Professionnelle
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Adresse exacte de Livraison (Pour les tournées logistiques et les
            BLI) *
          </label>
          <textarea
            rows="2"
            value={profileData?.deliveryAddress || ""}
            onChange={(e) => onChange("deliveryAddress", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Numéro, rue, bâtiment, instructions d'accès (ex: rampe arrière de déchargement)"
          />
          {errors?.deliveryAddress && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.deliveryAddress}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Téléphone direct du point de déchargement *
          </label>
          <input
            type="text"
            value={profileData?.deliveryPhone || ""}
            onChange={(e) => onChange("deliveryPhone", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : 06 11 22 33 44"
          />
          {errors?.deliveryPhone && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.deliveryPhone}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Tranche horaire de réception autorisée
          </label>
          <input
            type="text"
            value={profileData?.deliveryTimeSlot || ""}
            onChange={(e) => onChange("deliveryTimeSlot", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : 08:00 - 12:00, 14:00 - 17:00"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Digicodes / Barrière d'accès
          </label>
          <input
            type="text"
            value={profileData?.accessCode || ""}
            onChange={(e) => onChange("accessCode", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : Code Portail #2456, Hangar à l'arrière"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
            Limite de Gabarit de Livraison
          </label>
          <select
            value={profileData?.maxVehicleSize || "vl_standard"}
            onChange={(e) => onChange("maxVehicleSize", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none bg-white cursor-pointer"
          >
            <option value="vl_standard">Fourgon Léger (&lt; 3.5 tonnes)</option>
            <option value="porteur_19t">
              Poids Lourd Porteur (19 Tonnes Max)
            </option>
            <option value="semi_remorque">Semi-Remorque autorisé</option>
          </select>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Truck, ThermometerSnowflake } from "lucide-react";

export default function VehicleForm() {
  const [vehicleType, setVehicleType] = useState(
    "Fourgon Frigorifique (-2°C à +6°C)",
  );
  const [licensePlate, setLicensePlate] = useState("");

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <Truck className="text-purple-700 shrink-0" size={20} />
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Véhicule de Transport & Normes HACCP
          </h3>
          <p className="text-gray-500 font-medium">
            Déclaration du matériel frigorifique pour le respect de la chaîne du
            froid.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-gray-700 flex items-center gap-1.5">
            <ThermometerSnowflake size={14} className="text-purple-700" />
            <span>Type de Véhicule & Groupe Froid :</span>
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="Fourgon Frigorifique (-2°C à +6°C)">
              Fourgon Frigorifique (HACCP 2°C à 6°C)
            </option>
            <option value="Caisson Isotemp">
              Caisson Isotemp + Plaques Eutectiques
            </option>
            <option value="Camion Héritage Bâche">
              Camion Bâché (Transport caisses sèches)
            </option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Immatriculation du Véhicule :
          </label>
          <input
            type="text"
            placeholder="ex: AA-123-BB"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono uppercase focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

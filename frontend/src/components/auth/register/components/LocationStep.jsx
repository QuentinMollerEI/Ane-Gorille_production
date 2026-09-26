import React from "react";
import { MapPin, CheckCircle2, Lock, Loader2 } from "lucide-react";

export function LocationStep({
  address,
  onAddressChange,
  postalCode,
  onPostalCodeChange,
  city,
  onCityChange,
  onValidateLocation,
  verifyingLocation,
  locationVerified,
  detectedDistance,
  maxRadiusKm
}) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
          <MapPin size={16} className="text-emerald-700" />
          2. Adresse & Périmètre ({maxRadiusKm} km max) *
        </label>
        {locationVerified ? (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
            <CheckCircle2 size={12} /> Zone Validée ({detectedDistance} km)
          </span>
        ) : detectedDistance !== null ? (
          <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold">
            Hors zone ({detectedDistance} km)
          </span>
        ) : (
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Lock size={12} /> Validation Requise
          </span>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
          Adresse physique
        </label>
        <input
          type="text"
          value={address}
          onChange={onAddressChange}
          placeholder="Ex: 12 Rue des Maraîchers"
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
            Code Postal *
          </label>
          <input
            type="text"
            maxLength={5}
            value={postalCode}
            onChange={onPostalCodeChange}
            placeholder="28350"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
            Commune / Ville *
          </label>
          <input
            type="text"
            value={city}
            onChange={onCityChange}
            placeholder="Saint-Rémy-sur-Avre"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onValidateLocation}
        disabled={verifyingLocation || !address || !postalCode}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {verifyingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        <span>Valider la Localisation (Périmètre {maxRadiusKm} km)</span>
      </button>
    </div>
  );
}
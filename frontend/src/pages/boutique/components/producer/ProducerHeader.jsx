import React from "react";
import { MapPin, Heart } from "lucide-react";

export default function ProducerHeader({ producerProfile, isFavorite, onToggleFavorite }) {
  const name = producerProfile?.companyName || producerProfile?.displayName || "Exploitation Locale";
  const department = producerProfile?.postalCode ? producerProfile.postalCode.substring(0, 2) : "31";

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="h-44 bg-emerald-800 relative flex items-end p-6">
        {producerProfile?.bannerUrl && (
          <img
            src={producerProfile.bannerUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-emerald-800 font-black text-xl shrink-0">
              {name.charAt(0)}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-black">{name}</h1>
              <p className="flex items-center gap-2 text-emerald-100 font-semibold mt-0.5">
                <MapPin size={14} />
                <span>{producerProfile?.address || "Adresse certifiée"} ({department})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onToggleFavorite}
            className={`px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
              isFavorite
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            <span>{isFavorite ? "Dans vos favoris" : "Ajouter aux favoris"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { MapPin, Heart } from "lucide-react";

export default function ProducerHeader({ producerProfile, isFavorite, onToggleFavorite }) {
  const name = producerProfile?.companyName || producerProfile?.displayName || "Exploitation Locale";
  const address = producerProfile?.address || "Adresse certifiée";
  const department = producerProfile?.postalCode ? String(producerProfile.postalCode).substring(0, 2) : "";

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* CONTENEUR DE LA BANNIÈRE AVEC PHOTO DE FOND */}
      <div className="h-44 bg-emerald-800 relative flex items-end p-6 overflow-hidden">
        
        {/* 📸 Photo de couverture personnalisée par le producteur */}
        {producerProfile?.bannerUrl ? (
          <img
            src={producerProfile.bannerUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-300"
          />
        ) : (
          /* Motif/Dégradé par défaut si aucune photo n'est renseignée */
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-emerald-700 opacity-90" />
        )}

        {/* Voile sombre pour assurer le contraste des textes */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Contenu de l'en-tête au premier plan */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4">
            
            {/* 🖼️ Logo du producteur ou initiale par défaut */}
            <div className="w-16 h-16 bg-white rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-emerald-800 font-black text-xl shrink-0 overflow-hidden">
              {producerProfile?.logoUrl ? (
                <img src={producerProfile.logoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="text-white drop-shadow-sm">
              <h1 className="text-2xl font-black">{name}</h1>
              <p className="flex items-center gap-2 text-emerald-100 font-semibold mt-0.5 text-xs">
                <MapPin size={14} />
                <span>{address} {department ? `(${department})` : ""}</span>
              </p>
            </div>
          </div>

          {/* Bouton Favoris */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                isFavorite
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              <span>{isFavorite ? "Dans vos favoris" : "Ajouter aux favoris"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
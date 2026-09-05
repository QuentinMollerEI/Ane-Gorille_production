import React from "react";
import { Navigation } from "lucide-react";

/**
 * 🚛 COMPOSANT : TourSelectorForm.jsx
 * Emplacement : src/pages/MonProfil/Livreur/components/TourSelectorForm.jsx
 * Responsabilité unique : Gérer l'affectation et l'inscription du chauffeur aux deux tournées phares de la plateforme.
 */
export default function TourSelectorForm({ profileData, onChange, errors }) {
  const handleToggleTour = (field) => {
    onChange(field, !profileData[field]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Navigation size={16} className="text-blue-700" /> Inscription et
        Affectation aux Tournées Locales
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* TOURNEE DE RAMASSAGE - MATIN */}
        <div
          onClick={() => handleToggleTour("activePickupTour")}
          className={`p-5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-36 relative select-none ${
            profileData?.activePickupTour
              ? "border-blue-600 bg-blue-50/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-gray-900 uppercase">
              1. Tournée de Ramassage (Matin)
            </span>
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 ${profileData?.activePickupTour ? "bg-blue-600 border-blue-600" : "bg-transparent border-gray-300"}`}
            />
          </div>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-2">
            Collecte des caisses de légumes frais chez l'ensemble des maraîchers
            locaux raccordés. Génère vos{" "}
            <strong>bordereaux de chargement (BCH)</strong> de tournée.
          </p>
        </div>

        {/* TOURNEE DE LIVRAISON - APRES-MIDI */}
        <div
          onClick={() => handleToggleTour("activeDeliveryTour")}
          className={`p-5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-36 relative select-none ${
            profileData?.activeDeliveryTour
              ? "border-blue-600 bg-blue-50/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-gray-900 uppercase">
              2. Tournée de Livraison (Après-midi)
            </span>
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 ${profileData?.activeDeliveryTour ? "bg-blue-600 border-blue-600" : "bg-transparent border-gray-300"}`}
            />
          </div>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-2">
            Distribution et acheminement des commandes scindées aux écoles,
            mairies et commerces. Édite automatiquement les{" "}
            <strong>bons de livraison (BLI) signés</strong>.
          </p>
        </div>
      </div>

      {errors?.noTourSelected && (
        <p className="text-red-600 text-[10px] font-bold mt-2">
          {errors.noTourSelected}
        </p>
      )}
    </div>
  );
}

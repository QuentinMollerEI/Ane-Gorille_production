import React from "react";
import { Search } from "lucide-react";

/**
 * 🔍 COMPOSANT : TrackingFilters.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/components/TrackingFilters.jsx
 * Responsabilité unique : Affichage des boutons d'onglets de filtrage logistique
 * et de la barre de recherche textuelle réactive de l'acheteur.
 */
export default function TrackingFilters({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  totalCount,
  inProgressCount,
  completedCount,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
      {/* Sélecteur d'onglets logistiques */}
      <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-150 self-start">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "ALL"
              ? "bg-white text-gray-800 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Toutes ({totalCount})
        </button>
        <button
          onClick={() => setActiveFilter("IN_PROGRESS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "IN_PROGRESS"
              ? "bg-white text-amber-700 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          En cours ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveFilter("COMPLETED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "COMPLETED"
              ? "bg-white text-green-700 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Terminées ({completedCount})
        </button>
      </div>

      {/* Barre de recherche textuelle globale */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par n° de commande, établissement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
        />
      </div>
    </div>
  );
}

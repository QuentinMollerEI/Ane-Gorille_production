import React from "react";
import { Search, Filter } from "lucide-react";

/**
 * 🔍 COMPOSANT : DeliveryFilters.jsx
 * Responsabilité unique : Gérer la barre d'outils de filtrage et recherche des livraisons.
 */
export default function DeliveryFilters({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  counts,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
      {/* Onglets Filtres */}
      <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-150 self-start">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "ALL"
              ? "bg-white text-gray-800 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Tous ({counts.all})
        </button>
        <button
          onClick={() => setActiveFilter("TO_DELIVER")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "TO_DELIVER"
              ? "bg-white text-amber-700 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          À Livrer ({counts.toDeliver})
        </button>
        <button
          onClick={() => setActiveFilter("DELIVERED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFilter === "DELIVERED"
              ? "bg-white text-green-700 shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Livrés ({counts.delivered})
        </button>
      </div>

      {/* Barre de recherche réactive */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par client, adresse, n° de bon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
        />
      </div>
    </div>
  );
}

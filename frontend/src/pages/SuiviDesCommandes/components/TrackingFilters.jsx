import React from "react";
import { Search, ListOrdered, Clock, CheckCircle2 } from "lucide-react";

/**
 * 🔍 COMPOSANT : TrackingFilters.jsx
 * Filtres d'onglets logistiques et barre de recherche
 */
export default function TrackingFilters({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  totalCount = 0,
  inProgressCount = 0,
  completedCount = 0,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* BOUTONS D'ONGLETS */}
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "all"
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <ListOrdered size={14} />
            <span>Toutes ({totalCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter("in_progress")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "in_progress"
                ? "bg-amber-100 text-amber-900 shadow-sm border border-amber-200"
                : "text-gray-500 hover:text-amber-800"
            }`}
          >
            <Clock size={14} />
            <span>En cours ({inProgressCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "completed"
                ? "bg-emerald-100 text-emerald-900 shadow-sm border border-emerald-200"
                : "text-gray-500 hover:text-emerald-800"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Livrées ({completedCount})</span>
          </button>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="N° commande, maraîcher, légume..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
          />
        </div>
      </div>
    </div>
  );
}

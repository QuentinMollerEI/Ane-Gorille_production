import React from "react";
import { Search, Filter, Calendar, X, RefreshCw } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingFilters.jsx
 * Barre de filtres et recherche dynamique pour le suivi des commandes.
 */
export default function TrackingFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  dateFilter,
  setDateFilter,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Recherche textuelle */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par N° de commande, client, producteur, N° de lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtre Statut */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-xl px-3 py-2 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer"
          >
            <option value="all">Tous les statuts ({totalCount})</option>
            <option value="paid">Payée / Confirmée</option>
            <option value="preparing">En Récolte & Préparation</option>
            <option value="ready_for_pickup">Prête à Enlever (Consignée)</option>
            <option value="in_transit">En Tournée de Livraison</option>
            <option value="delivered">Livrée / Réceptionnée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        {/* Filtre Période */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={14} className="text-gray-400 shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-xl px-3 py-2 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
          </select>
        </div>

        {/* Réinitialisation */}
        {(searchTerm || selectedStatus !== "all" || dateFilter !== "all") && (
          <button
            onClick={onResetFilters}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            title="Réinitialiser les filtres"
          >
            <RefreshCw size={13} />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {/* Compteur de résultats */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
        <span>
          Affichage de <strong className="text-emerald-800">{filteredCount}</strong> commande(s) sur {totalCount}
        </span>
        {selectedStatus !== "all" && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
            Filtre : {selectedStatus}
          </span>
        )}
      </div>
    </div>
  );
}

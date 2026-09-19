import React from "react";
import { Search, Filter, Calendar, X, RefreshCw } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingFilters.jsx
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
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-2.5 text-xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par N° de commande, client, producteur, N° de lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 text-xs font-mono shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter size={13} className="text-gray-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer shadow-2xs"
          >
            <option value="all">Tous les statuts ({totalCount})</option>
            <option value="paid">Payée / Confirmée</option>
            <option value="preparing">En Récolte & Préparation</option>
            <option value="ready_for_pickup">Commande Prête / Prête à Enlever</option>
            <option value="in_transit">En Tournée de Livraison</option>
            <option value="delivered">Livrée / Réceptionnée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer shadow-2xs"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
          </select>
        </div>

        {(searchTerm || selectedStatus !== "all" || dateFilter !== "all") && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            title="Réinitialiser les filtres"
          >
            <RefreshCw size={12} />
            <span>Effacer</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold pt-1 border-t border-gray-100">
        <span>
          Affichage de <strong className="text-emerald-800 font-mono">{filteredCount}</strong> commande(s) sur <span className="font-mono">{totalCount}</span>
        </span>
        {selectedStatus !== "all" && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
            Filtre : {selectedStatus}
          </span>
        )}
      </div>
    </div>
  );
}
import React from "react";
import { Search, MapPin, Calendar } from "lucide-react";

/**
 * 🔍 COMPOSANT : RouteFilters.jsx
 * Responsabilité unique : Afficher l'interface de filtrage local (Recherche, Secteur, Date).
 */
export default function RouteFilters({
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  sectors = [],
  selectedDate,
  setSelectedDate,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Moteur de recherche textuel */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-3.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un maraîcher, acheteur, adresse..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 2. Filtre par secteur dynamique */}
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3.5 top-3.5 text-gray-400"
          />
          <select
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all appearance-none"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="ALL">Tous les secteurs logistiques</option>
            {sectors.map((sector, idx) => (
              <option key={idx} value={sector}>
                Secteur {sector}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Sélecteur de date de tournée */}
        <div className="relative">
          <Calendar
            size={16}
            className="absolute left-3.5 top-3.5 text-gray-400"
          />
          <input
            type="date"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white transition-all"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

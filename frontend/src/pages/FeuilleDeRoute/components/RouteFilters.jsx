import React from "react";
import { Search, Filter, Calendar, MapPin, Navigation } from "lucide-react";

/**
 * 🔍 COMPOSANT : RouteFilters.jsx
 * Responsabilité unique : Gérer l'affichage des filtres de date, de secteur de livraison
 * et de recherche de commande pour optimiser la feuille de route logistique.
 */
export default function RouteFilters({
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  sectors,
  selectedDate,
  setSelectedDate,
}) {
  return (
    <div className="bg-white border border-gray-250 rounded-2xl shadow-sm p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Recherche textuelle */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un producteur, acheteur, commune..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
          />
        </div>

        {/* Sélecteur de secteur logistique (Mutualisation) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-black bg-white focus:outline-none focus:ring-1 focus:ring-green-500 appearance-none cursor-pointer"
            >
              <option value="ALL">Tous les secteurs de livraison</option>
              {sectors.map((sector, index) => (
                <option key={index} value={sector}>
                  Secteur : {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Date de tournée */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs font-black bg-white focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

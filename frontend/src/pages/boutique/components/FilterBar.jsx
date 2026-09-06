import React from "react";
import { Search, Filter, Leaf } from "lucide-react";

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedProducer,
  setSelectedProducer,
  onlyBio,
  setOnlyBio,
  producers,
}) {
  return (
    <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
        <Filter size={18} className="text-green-700" aria-hidden="true" />
        <h2 className="font-semibold text-gray-800 text-lg">
          Recherche & Filtres
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Champ de recherche avec accessibilité améliorée */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" aria-hidden="true" />
          </div>
          <label htmlFor="search-input" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher un produit (ex: Carottes)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-green-500 focus:border-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sélection du producteur */}
        <div className="md:col-span-4">
          <label htmlFor="producer-select" className="sr-only">
            Filtrer par producteur
          </label>
          <select
            id="producer-select"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-green-500 focus:border-green-500 text-gray-700"
            value={selectedProducer}
            onChange={(e) => setSelectedProducer(e.target.value)}
          >
            <option value="">Tous les producteurs</option>
            {producers &&
              producers.map((producer, index) => (
                <option key={index} value={producer}>
                  {producer}
                </option>
              ))}
          </select>
        </div>

        {/* Action : Filtre Bio */}
        <div className="md:col-span-3 flex justify-end">
          <label className="flex items-center gap-2 cursor-pointer bg-green-50 px-4 py-2 rounded-md border border-green-100 hover:bg-green-100 transition-colors w-full justify-center md:w-auto shadow-sm">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-green-700 focus:ring-green-500"
              checked={onlyBio}
              onChange={(e) => setOnlyBio(e.target.checked)}
            />
            <Leaf
              size={16}
              className={onlyBio ? "text-green-700" : "text-gray-400"}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-gray-800">
              100% Bio
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}

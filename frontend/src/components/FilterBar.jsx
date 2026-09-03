import React from 'react';
import { Search, X } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedProducer,
  setSelectedProducer,
  onlyBio,
  setOnlyBio,
  producers
}) {
  const hasActiveFilters = searchQuery || selectedProducer || onlyBio;

  const handleReset = () => {
    setSearchQuery('');
    setSelectedProducer('');
    setOnlyBio(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row flex-grow items-center gap-4">
        {/* Recherche textuelle par produit */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher un légume, fruit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
          />
        </div>

        {/* Sélection par producteur */}
        <div className="w-full sm:w-56">
          <select
            value={selectedProducer}
            onChange={(e) => setSelectedProducer(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white transition-all capitalize text-gray-700"
          >
            <option value="">Tous les producteurs</option>
            {producers.map((producer, index) => (
              <option key={index} value={producer}>
                {producer}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Agriculture Biologique */}
        <label className="flex items-center space-x-3 cursor-pointer select-none py-2 px-1">
          <input
            type="checkbox"
            checked={onlyBio}
            onChange={(e) => setOnlyBio(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green transition-all"
          />
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <span className="bg-emerald-100 text-brand-green text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5">BIO</span>
            Uniquement certifié Bio
          </span>
        </label>
      </div>

      {/* Bouton de réinitialisation rapide */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="flex items-center justify-center text-xs font-semibold text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 self-end md:self-auto"
        >
          <X size={14} className="mr-1.5" />
          Effacer les filtres
        </button>
      )}
    </div>
  );
}

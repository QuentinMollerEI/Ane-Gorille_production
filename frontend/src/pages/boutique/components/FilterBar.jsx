import React from "react";
import { Search, Filter, Award } from "lucide-react";

/**
 * 🔍 COMPOSANT : FilterBar.jsx
 * Barre de recherche et de filtres.
 */
export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onlyBio,
  setOnlyBio,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-4 text-xs font-semibold">
      {/* RECHERCHE TEXTUELLE */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une culture, un maraîcher, une légume..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-gray-800"
        />
      </div>

      {/* FILTRE CATÉGORIE */}
      <div className="flex items-center gap-2">
        <Filter size={15} className="text-gray-400 shrink-0" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-200 rounded-2xl px-3 py-2.5 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
        >
          <option value="">Toutes catégories</option>
          <option value="Légumes">Légumes</option>
          <option value="Fruits">Fruits</option>
          <option value="Aromates">Aromates</option>
          <option value="Épicerie">Épicerie</option>
        </select>
      </div>

      {/* FILTRE LABEL BIO */}
      <button
        onClick={() => setOnlyBio(!onlyBio)}
        className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold ${
          onlyBio
            ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
        }`}
      >
        <Award
          size={15}
          className={onlyBio ? "text-amber-800" : "text-gray-400"}
        />
        <span>Certifié Bio (EGAlim)</span>
      </button>
    </div>
  );
}

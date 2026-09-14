import React from "react";
import { Search, Award, Heart, MapPin, X, ArrowUpDown } from "lucide-react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  isBioOnly,
  setIsBioOnly,
  favoritesOnly,
  setFavoritesOnly,
  selectedDept,
  setSelectedDept,
  sortBy,
  setSortBy,
  categories = [],
  departments = []
}) {
  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    isBioOnly ||
    favoritesOnly ||
    selectedDept !== "all" ||
    (sortBy && sortBy !== "default");

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setIsBioOnly(false);
    setFavoritesOnly(false);
    setSelectedDept("all");
    if (setSortBy) setSortBy("default");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
      <div className="flex flex-col md:flex-row gap-3 items-center">
        
        {/* Champ de recherche */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une récolte, un légume, une ferme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtres et Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 font-extrabold cursor-pointer ${
              favoritesOnly
                ? "bg-red-500 text-white border-red-500 shadow-xs"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Heart size={14} fill={favoritesOnly ? "currentColor" : "none"} />
            <span>Mes Favoris</span>
          </button>

          <button
            onClick={() => setIsBioOnly(!isBioOnly)}
            className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 font-extrabold cursor-pointer ${
              isBioOnly
                ? "bg-amber-400 text-amber-950 border-amber-400 shadow-xs"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Award size={14} />
            <span>Bio (EGAlim)</span>
          </button>

          {/* Sélecteur de département (dynamique) */}
          {departments.length > 0 && (
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer appearance-none pr-8"
              >
                <option value="all">Tous dépts</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>Dépt {dept}</option>
                ))}
              </select>
              <MapPin size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sélecteur de Tri */}
          <div className="relative">
            <select
              value={sortBy || "default"}
              onChange={(e) => setSortBy && setSortBy(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer appearance-none pr-8"
            >
              <option value="default">Pertinence</option>
              <option value="price-asc">Prix HT : Croissant</option>
              <option value="price-desc">Prix HT : Décroissant</option>
              <option value="stock-desc">Stock le plus élevé</option>
              <option value="name-asc">Nom (A-Z)</option>
            </select>
            <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2.5 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Réinitialiser les filtres"
            >
              <X size={14} />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Catégories (dynamiques) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "all" ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tous les produits
          </button>
          {categories.map((cat) => {
            const catId = cat.id || cat;
            const catLabel = cat.label || cat;
            return (
              <button
                key={catId}
                onClick={() => setSelectedCategory(catId)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === catId ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {catLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
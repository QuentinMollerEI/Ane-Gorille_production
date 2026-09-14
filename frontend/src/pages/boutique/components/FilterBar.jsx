import React from "react";
import { Search, Award, Heart, MapPin, X, SlidersHorizontal } from "lucide-react";

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
  categories = [
    { id: "all", label: "Toutes les récoltes" },
    { id: "legumes", label: "Légumes frais" },
    { id: "fruits", label: "Fruits de saison" },
    { id: "cremerie", label: "Crémerie & Œufs" },
    { id: "viandes", label: "Viandes & Volailles" },
    { id: "boissons", label: "Jus & Boissons" }
  ],
  departments = ["31", "32", "81", "82"]
}) {
  // Calcul du nombre de filtres actuellement actifs
  const activeFiltersCount = [
    searchTerm !== "",
    selectedCategory !== "all",
    isBioOnly,
    favoritesOnly,
    selectedDept !== "all"
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setIsBioOnly(false);
    setFavoritesOnly(false);
    setSelectedDept("all");
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-4 shadow-sm space-y-3.5 text-xs transition-all">
      
      {/* Ligne Supérieure : Recherche + Toggles filtres */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {/* Champ de recherche principal */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un légume, une variété, une ferme ou une commune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-gray-50/70 hover:bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-2xl font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-600/10 transition-all text-xs"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 bg-gray-200/60 hover:bg-gray-200 p-1 rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-xs">
              /
            </kbd>
          )}
        </div>

        {/* Boutons d'actions et filtres rapides */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          
          {/* Toggle Favoris */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2 font-extrabold cursor-pointer shadow-xs ${
              favoritesOnly
                ? "bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/20"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <Heart size={14} fill={favoritesOnly ? "currentColor" : "none"} className={favoritesOnly ? "text-rose-600" : "text-gray-400"} />
            <span>Mes Favoris</span>
          </button>

          {/* Toggle Bio EGAlim */}
          <button
            onClick={() => setIsBioOnly(!isBioOnly)}
            className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2 font-extrabold cursor-pointer shadow-xs ${
              isBioOnly
                ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <Award size={14} className={isBioOnly ? "text-amber-600" : "text-gray-400"} />
            <span>Bio (EGAlim)</span>
          </button>

          {/* Sélecteur de Département */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`pl-9 pr-8 py-2.5 border rounded-2xl font-extrabold text-xs cursor-pointer appearance-none transition-all shadow-xs focus:outline-none focus:ring-4 focus:ring-emerald-600/10 ${
                selectedDept !== "all"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <option value="all">Tous dépts</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  Dépt {dept}
                </option>
              ))}
            </select>
            <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${selectedDept !== "all" ? "text-emerald-700" : "text-gray-400"}`} />
          </div>

          {/* Bouton Réinitialiser avec Compteur */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3.5 py-2.5 text-xs font-bold text-gray-600 hover:text-red-700 bg-gray-100 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>Effacer ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Ligne Inférieure : Barre des Catégories (Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-gray-100">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <SlidersHorizontal size={11} />
          Catégories :
        </span>
        {categories.map((cat) => {
          const catId = cat.id || cat;
          const isSelected = selectedCategory === catId;
          return (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-800 text-white shadow-xs scale-[1.02]"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"
              }`}
            >
              {cat.label || cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
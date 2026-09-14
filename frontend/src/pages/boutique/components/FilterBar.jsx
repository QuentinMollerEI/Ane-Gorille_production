import React from "react";
import { Search, Filter, MapPin, Award, Heart, ArrowUpDown, X } from "lucide-react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isBioOnly,
  setIsBioOnly,
  onlyBio,
  setOnlyBio,
  selectedLabel,
  setSelectedLabel,
  favoritesOnly,
  setFavoritesOnly,
  selectedDept,
  setSelectedDept,
  sortBy,
  setSortBy,
  categories = [],
  departments = [],
}) {
  // 1. Normalisation de la recherche textuelle
  const currentSearch = searchTerm !== undefined ? searchTerm : searchQuery || "";
  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (setSearchTerm) setSearchTerm(val);
    if (setSearchQuery) setSearchQuery(val);
  };

  // 2. Normalisation du label sélectionné
  const currentLabel =
    selectedLabel !== undefined
      ? selectedLabel
      : (isBioOnly || onlyBio)
      ? "isBio"
      : "all";

  const handleLabelChange = (e) => {
    const val = e.target.value;
    if (setSelectedLabel) setSelectedLabel(val);
    if (setIsBioOnly) setIsBioOnly(val === "isBio");
    if (setOnlyBio) setOnlyBio(val === "isBio");
  };

  // 3. Détection des filtres actifs
  const hasActiveFilters =
    Boolean(currentSearch.trim()) ||
    (selectedCategory && selectedCategory !== "all" && selectedCategory !== "") ||
    currentLabel !== "all" ||
    Boolean(favoritesOnly) ||
    (selectedDept && selectedDept !== "all" && selectedDept !== "") ||
    (sortBy && sortBy !== "default" && sortBy !== "relevance");

  // 4. Réinitialisation complète
  const handleReset = () => {
    if (setSearchTerm) setSearchTerm("");
    if (setSearchQuery) setSearchQuery("");
    if (setSelectedCategory) setSelectedCategory("all");
    if (setSelectedLabel) setSelectedLabel("all");
    if (setIsBioOnly) setIsBioOnly(false);
    if (setOnlyBio) setOnlyBio(false);
    if (setFavoritesOnly) setFavoritesOnly(false);
    if (setSelectedDept) setSelectedDept("all");
    if (setSortBy) setSortBy("default");
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-2 shadow-xs transition-all">
      {/* BARRE MONO-LIGNE COMPACTE ET ERGONOMIQUE */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
        
        {/* 🔍 1. Champ de Recherche Textuelle (S'agrandit pour occuper l'espace disponible) */}
        <div className="relative flex-1 min-w-[200px] h-9">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une culture, un maraîcher, un légume..."
            value={currentSearch}
            onChange={handleSearchChange}
            className="w-full h-full pl-9 pr-3 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* 🗂️ 2. Sélecteur de Catégorie */}
        <div className="relative shrink-0 h-9">
          <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={selectedCategory || "all"}
            onChange={(e) => setSelectedCategory && setSelectedCategory(e.target.value)}
            className="h-full pl-8 pr-7 bg-gray-50/80 border border-gray-200/80 text-gray-700 font-extrabold text-[11px] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all appearance-none"
          >
            <option value="all">Toutes catégories</option>
            {categories.length > 0 ? (
              categories.map((cat) => {
                const catId = typeof cat === "object" ? cat.id || cat.value || cat.label : cat;
                const catLabel = typeof cat === "object" ? cat.label || cat.name || cat.id : cat;
                return (
                  <option key={catId} value={catId}>
                    {catLabel}
                  </option>
                );
              })
            ) : (
              <>
                <option value="Légumes">Légumes</option>
                <option value="Fruits">Fruits</option>
                <option value="Aromates">Aromates</option>
                <option value="Miel & Apiculture">Miel & Apiculture</option>
                <option value="Œufs & Élevage">Œufs & Élevage</option>
                <option value="Épicerie">Épicerie</option>
              </>
            )}
          </select>
        </div>

        {/* 📍 3. Sélecteur / Input de Département */}
        <div className="relative shrink-0 h-9">
          <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
          {departments && departments.length > 0 ? (
            <select
              value={selectedDept || "all"}
              onChange={(e) => setSelectedDept && setSelectedDept(e.target.value)}
              className="h-full pl-8 pr-7 bg-gray-50/80 border border-gray-200/80 text-gray-700 font-extrabold text-[11px] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all appearance-none"
            >
              <option value="all">Tous dépts</option>
              {departments.map((dept) => {
                const val = typeof dept === "object" ? dept.value || dept.id : dept;
                const label = typeof dept === "object" ? dept.label || dept.name : dept;
                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Dépt (ex: 31)"
              value={selectedDept && selectedDept !== "all" ? selectedDept : ""}
              onChange={(e) => setSelectedDept && setSelectedDept(e.target.value)}
              className="h-full w-24 pl-8 pr-2.5 bg-gray-50/80 border border-gray-200/80 text-gray-800 font-bold text-[11px] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          )}
        </div>

        {/* 🏅 4. Sélecteur Déroulant des Labels SIQO / EGAlim */}
        <div className="relative shrink-0 h-9">
          <Award size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none" />
          <select
            value={currentLabel}
            onChange={handleLabelChange}
            className="h-full pl-8 pr-7 bg-gray-50/80 border border-gray-200/80 text-gray-700 font-extrabold text-[11px] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all appearance-none"
          >
            <option value="all">Tous les labels</option>
            <option value="isBio">🌿 Bio (AB)</option>
            <option value="isHve">🍃 HVE</option>
            <option value="isAop">🍷 AOP</option>
            <option value="isAoc">🍇 AOC</option>
            <option value="isIgp">🗺️ IGP</option>
            <option value="isLabelRouge">🔴 Label Rouge</option>
          </select>
        </div>

        {/* ↕️ 5. Sélecteur de Tri */}
        {setSortBy && (
          <div className="relative shrink-0 h-9">
            <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortBy || "default"}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-full pl-8 pr-7 bg-gray-50/80 border border-gray-200/80 text-gray-700 font-extrabold text-[11px] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all appearance-none"
            >
              <option value="default">Pertinence</option>
              <option value="priceAsc">Prix : + bas au + haut</option>
              <option value="priceDesc">Prix : + haut au + bas</option>
              <option value="stockDesc">Stock disponible</option>
            </select>
          </div>
        )}

        {/* ❤️ 6. Toggle Favoris */}
        {setFavoritesOnly && (
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            title={favoritesOnly ? "Afficher tous les produits" : "Favoris uniquement"}
            className={`h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              favoritesOnly
                ? "bg-red-50 text-red-600 border-red-200 shadow-xs"
                : "bg-gray-50/80 text-gray-400 border-gray-200/80 hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <Heart size={14} className={favoritesOnly ? "fill-red-500 text-red-500" : ""} />
          </button>
        )}

        {/* ❌ 7. Bouton de Réinitialisation dynamique */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            title="Réinitialiser tous les filtres"
            className="h-9 px-2.5 shrink-0 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-[11px] border border-red-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer animate-fade-in"
          >
            <X size={13} />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        )}

      </div>
    </div>
  );
}
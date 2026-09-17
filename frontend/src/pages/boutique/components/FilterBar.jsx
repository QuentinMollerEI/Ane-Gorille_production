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
  // 1. Normalisation de la recherche textuelle (compatibilité ascendante)
  const currentSearch = searchTerm !== undefined ? searchTerm : searchQuery || "";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (setSearchTerm) setSearchTerm(val);
    if (setSearchQuery) setSearchQuery(val);
  };

  // 2. Normalisation du filtre Bio (EGAlim)
  const isBioActive = Boolean(isBioOnly || onlyBio || selectedLabel === "isBio");

  const handleToggleBio = () => {
    const nextBio = !isBioActive;
    if (setIsBioOnly) setIsBioOnly(nextBio);
    if (setOnlyBio) setOnlyBio(nextBio);
    if (setSelectedLabel) setSelectedLabel(nextBio ? "isBio" : "all");
  };

  // 3. Bascule dynamique du filtre Favoris
  const handleToggleFavorites = () => {
    if (setFavoritesOnly) {
      setFavoritesOnly(!favoritesOnly);
    }
  };

  // 4. Détection dynamique des filtres actifs
  const hasActiveFilters =
    Boolean(currentSearch.trim()) ||
    (selectedCategory && selectedCategory !== "all" && selectedCategory !== "") ||
    isBioActive ||
    Boolean(favoritesOnly) ||
    (selectedDept && selectedDept !== "all" && selectedDept !== "") ||
    (sortBy && sortBy !== "default" && sortBy !== "relevance");

  // 5. Réinitialisation globale de tous les filtres
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
    <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3 text-xs font-semibold">
      
      {/* 🔍 1. Champ de Recherche Textuelle */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une culture, un maraîcher, un légume..."
          value={currentSearch}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* 🗂️ 2. Sélecteur de Catégorie */}
      <div className="flex items-center gap-2">
        <Filter size={15} className="text-gray-400 shrink-0" />
        <select
          value={selectedCategory || "all"}
          onChange={(e) => setSelectedCategory && setSelectedCategory(e.target.value)}
          className="border border-gray-200 rounded-2xl px-3 py-2.5 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
        >
          <option value="all">Toutes catégories</option>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <option key={cat.id || cat} value={cat.id || cat}>
                {cat.label || cat}
              </option>
            ))
          ) : (
            <>
              <option value="Légumes">Légumes</option>
              <option value="Fruits">Fruits</option>
              <option value="Aromates">Aromates</option>
              <option value="Épicerie">Épicerie</option>
            </>
          )}
        </select>
      </div>

      {/* 📍 3. Sélecteur de Département (Optionnel) */}
      {setSelectedDept && (
        <div className="flex items-center gap-1.5">
          <MapPin size={15} className="text-gray-400 shrink-0" />
          <select
            value={selectedDept || "all"}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="border border-gray-200 rounded-2xl px-3 py-2.5 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">Tous dépts</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                Dépt {dept}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 🏅 4. Bouton Filtre Bio (EGAlim) */}
      <button
        type="button"
        onClick={handleToggleBio}
        className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold shrink-0 ${
          isBioActive
            ? "bg-amber-100 text-amber-900 border-amber-300 shadow-xs"
            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
        }`}
      >
        <Award size={15} className={isBioActive ? "text-amber-800" : "text-gray-400"} />
        <span>Certifié Bio (EGAlim)</span>
      </button>

      {/* ❤️ 5. Bouton Mes Favoris */}
      <button
        type="button"
        onClick={handleToggleFavorites}
        className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold shrink-0 ${
          favoritesOnly
            ? "bg-red-50 text-red-700 border-red-200 shadow-xs"
            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
        }`}
      >
        <Heart
          size={15}
          className={favoritesOnly ? "text-red-500 fill-red-500" : "text-gray-400"}
        />
        <span>Mes Favoris</span>
      </button>

      {/* ↕️ 6. LISTE DÉROULANTE : ORDRE D'AFFICHAGE ET TRI */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={15} className="text-gray-400 shrink-0" />
        <select
          value={sortBy || "default"}
          onChange={(e) => setSortBy && setSortBy(e.target.value)}
          className="border border-gray-200 rounded-2xl px-3 py-2.5 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
          title="Ordre d'affichage du catalogue"
        >
          <option value="default">Ordre d'affichage : Pertinence</option>
          <option value="priceAsc">Prix : du - cher au + cher</option>
          <option value="priceDesc">Prix : du + cher au - cher</option>
          <option value="titleAsc">Nom : De A à Z</option>
          <option value="stockDesc">Stock disponible (décroissant)</option>
        </select>
      </div>

      {/* ❌ 7. Bouton Réinitialisation générale */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-2xl transition-all cursor-pointer shrink-0"
          title="Réinitialiser tous les filtres"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
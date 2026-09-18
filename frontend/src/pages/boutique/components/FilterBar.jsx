import React from "react";
import { Search, Filter, MapPin, Award, Heart, ArrowUpDown, X } from "lucide-react";

// Liste officielle des 7 catégories d'ajout de produit
const OFFICIAL_CATEGORIES = [
  "Légumes",
  "Fruits",
  "Herbes",
  "Miel & Apiculture",
  "Œufs & Élevage",
  "Produits Secs & Épicerie",
  "Produits Transformés & Conserves"
];

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  searchQuery,
  setSearchQuery,
  selectedCategory = "all",
  setSelectedCategory,
  isBioOnly,
  setIsBioOnly,
  onlyBio,
  setOnlyBio,
  selectedLabel,
  setSelectedLabel,
  favoritesOnly,
  setFavoritesOnly,
  selectedDept = "all",
  setSelectedDept,
  sortBy = "default",
  setSortBy,
  categories = [],
  departments = [],
}) {
  // Normalisation de la recherche textuelle
  const searchValue = searchTerm !== undefined ? searchTerm : searchQuery || "";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (setSearchTerm) setSearchTerm(val);
    if (setSearchQuery) setSearchQuery(val);
  };

  // Normalisation du filtre Bio
  const isBioActive = Boolean(isBioOnly || onlyBio || selectedLabel === "isBio");

  const handleBioToggle = () => {
    const nextBio = !isBioActive;
    if (setIsBioOnly) setIsBioOnly(nextBio);
    if (setOnlyBio) setOnlyBio(nextBio);
    if (setSelectedLabel) setSelectedLabel(nextBio ? "isBio" : "all");
  };

  // Fusion dynamique des catégories avec les 7 catégories officielles
  const displayCategories = Array.from(
    new Set([...OFFICIAL_CATEGORIES, ...(categories || [])])
  );

  // Filtrage strict des départements pour ne conserver QUE les numéros à 2 chiffres
  const validDepartments = Array.from(
    new Set(
      (departments || [])
        .map((d) => String(d).trim().replace(/\D/g, "").substring(0, 2))
        .filter((d) => d.length === 2)
    )
  ).sort();

  const hasActiveFilters =
    Boolean(searchValue.trim()) ||
    (selectedCategory && selectedCategory !== "all" && selectedCategory !== "") ||
    isBioActive ||
    Boolean(favoritesOnly) ||
    (selectedDept && selectedDept !== "all" && selectedDept !== "") ||
    (sortBy && sortBy !== "default" && sortBy !== "relevance");

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
    <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
      {/* 🔍 1. Zone de Recherche Adaptative */}
      <div className="relative flex-1 min-w-[220px] sm:min-w-[280px]">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher une culture, un maraîcher, un légume..."
          value={searchValue}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-8 py-2 bg-gray-50/60 border border-gray-200 rounded-xl font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all text-xs"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              if (setSearchTerm) setSearchTerm("");
              if (setSearchQuery) setSearchQuery("");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            title="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 🗂️ 2. Filtres & Tri (Flex-wrap pour s'ajuster parfaitement sans décaler l'écran) */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
        {/* Catégories */}
        <div className="relative max-w-[170px] sm:max-w-[200px]">
          <select
            value={selectedCategory || "all"}
            onChange={(e) => setSelectedCategory && setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-gray-50/60 hover:bg-gray-100/80 border border-gray-200 rounded-xl pl-8 pr-7 py-2 font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-xs truncate"
          >
            <option value="all">Toutes catégories</option>
            {displayCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Département */}
        {setSelectedDept && (
          <div className="relative">
            <select
              value={selectedDept || "all"}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none bg-gray-50/60 hover:bg-gray-100/80 border border-gray-200 rounded-xl pl-8 pr-7 py-2 font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-xs"
            >
              <option value="all">Tous dépts</option>
              {validDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  Dépt {dept}
                </option>
              ))}
            </select>
            <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
          </div>
        )}

        {/* Bouton Bio */}
        <button
          type="button"
          onClick={handleBioToggle}
          className={`px-3 py-2 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
            isBioActive
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
              : "bg-gray-50/60 text-gray-600 border-gray-200 hover:bg-gray-100/80"
          }`}
        >
          <Award size={14} className={isBioActive ? "text-emerald-600" : "text-gray-400"} />
          <span>Bio</span>
        </button>

        {/* Bouton Fournisseurs Favoris */}
        {setFavoritesOnly && (
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-2 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
              favoritesOnly
                ? "bg-rose-50 text-rose-700 border-rose-200 shadow-2xs"
                : "bg-gray-50/60 text-gray-600 border-gray-200 hover:bg-gray-100/80"
            }`}
          >
            <Heart size={14} className={favoritesOnly ? "text-rose-600 fill-rose-600" : "text-gray-400"} />
            <span>Favoris</span>
          </button>
        )}

        {/* ↕️ Tri (Pertinence / Stock / Prix) - Protégé contre le débordement */}
        {setSortBy && (
          <div className="relative max-w-[180px] sm:max-w-[210px]">
            <select
              value={sortBy || "default"}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-gray-50/60 hover:bg-gray-100/80 border border-gray-200 rounded-xl pl-8 pr-7 py-2 font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all text-xs truncate"
            >
              <option value="default">Ordre d'affichage</option>
              <option value="stock-desc">Stock : Du + au - dispo</option>
              <option value="stock-asc">Stock : Du - au + dispo</option>
              <option value="price-asc">Prix HT : Croissant</option>
              <option value="price-desc">Prix HT : Décroissant</option>
              <option value="name-asc">Nom (A-Z)</option>
              <option value="date-desc">Plus récents</option>
            </select>
            <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Bouton Réinitialiser */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Effacer tous les filtres"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
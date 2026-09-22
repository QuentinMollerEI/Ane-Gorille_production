import React from "react";
import { 
  Search, 
  ArrowUpDown, 
  RotateCcw, 
  Calendar, 
  CreditCard, 
  Tag, 
  Rows
} from "lucide-react";

/**
 * 🎛️ COMPOSANT : OrderTrackingFilters.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/OrderTrackingFilters.jsx
 * 
 * Responsabilité Unique (SRP) :
 * Barre de recherche multi-critères, filtres par statut/règlement/date,
 * option de tri dynamique et sélecteur de pagination (10 / 20 / 50 / Tout).
 */
export default function OrderTrackingFilters({
  searchTerm = "",
  setSearchTerm,
  statusFilter = "ALL",
  setStatusFilter,
  paymentFilter = "ALL",
  setPaymentFilter,
  dateFilter = "",
  setDateFilter,
  sortBy = "createdAt",
  setSortBy,
  sortOrder = "desc",
  setSortOrder,
  itemsPerPage = 10,
  setItemsPerPage,
  totalItems = 0,
  filteredCount = 0,
  onResetFilters
}) {
  const hasActiveFilters = 
    searchTerm.trim() !== "" || 
    statusFilter !== "ALL" || 
    paymentFilter !== "ALL" || 
    dateFilter !== "" || 
    sortBy !== "createdAt" || 
    sortOrder !== "desc";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm text-xs font-sans text-slate-800">
      {/* 1. LIGNE SUPÉRIEURE : Recherche & Contrôles Rapides */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Champ de Recherche */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher par N° commande (#CMD-...), client, produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sélecteur du Nombre d'Éléments par Page (10 / 20 / 50 / Tout) */}
        <div className="flex items-center gap-2 self-end md:self-auto bg-slate-50 border border-slate-200 p-1 rounded-lg shrink-0">
          <span className="text-[11px] font-bold text-slate-600 pl-2 flex items-center gap-1">
            <Rows size={13} className="text-emerald-700" /> Afficher :
          </span>
          <div className="flex items-center gap-1">
            {[10, 20, 50, "ALL"].map((val) => {
              const isSelected = itemsPerPage === val || (val === "ALL" && itemsPerPage >= 999999);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setItemsPerPage(val === "ALL" ? 999999 : val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {val === "ALL" ? "Tout" : val}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. LIGNE INFÉRIEURE : Filtres Multi-Critères & Options de Tri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
        
        {/* Filtre 1 : Statut de Commande */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Tag size={12} className="text-emerald-700" /> Statut
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="paid">En cours / Payé</option>
            <option value="delivered">Livré</option>
            <option value="preparing">En préparation maraîchère</option>
          </select>
        </div>

        {/* Filtre 2 : Mode de Règlement */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CreditCard size={12} className="text-emerald-700" /> Règlement
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tous les modes</option>
            <option value="stripe_b2b">Carte / SEPA (Stripe)</option>
            <option value="mandat_public">Mandat Chorus Pro (B2G)</option>
            <option value="virement_b2b">Virement B2B (LME 30j)</option>
          </select>
        </div>

        {/* Filtre 3 : Date de Livraison Cible */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} className="text-emerald-700" /> Date Livraison
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tri : Critère & Ordre */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown size={12} className="text-emerald-700" /> Trier Par
          </label>
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="createdAt">Date d'achat</option>
              <option value="selectedDate">Date de livraison</option>
              <option value="totalTTC">Montant Total TTC</option>
              <option value="buyerName">Acheteur / Client</option>
            </select>
            <button
              type="button"
              title={sortOrder === "asc" ? "Ordre Croissant (A-Z, 0-9)" : "Ordre Décroissant (Z-A, 9-0)"}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-bold shrink-0 transition-colors cursor-pointer"
            >
              {sortOrder === "asc" ? "▲" : "▼"}
            </button>
          </div>
        </div>

      </div>

      {/* 3. BARRE DE RÉSUMÉ & RÉINITIALISATION DES FILTRES */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
        <span>
          Commandes affichées : <strong className="text-slate-900 font-bold">{filteredCount}</strong> sur <strong className="text-slate-900">{totalItems}</strong> au total
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors"
          >
            <RotateCcw size={12} />
            <span>Réinitialiser les filtres</span>
          </button>
        )}
      </div>
    </div>
  );
}

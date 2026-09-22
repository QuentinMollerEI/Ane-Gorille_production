import React from "react";
import { 
  Search, 
  ArrowUpDown, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  RefreshCw, 
  Rows
} from "lucide-react";

/**
 * 🎛️ COMPOSANT : OrderTrackingFilters.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/OrderTrackingFilters.jsx (ou src/pages/SuiviDesCommandes/OrderTrackingFilters.jsx)
 * Barre de recherche, filtres par statut/règlement/date, tri dynamique et sélecteur de pagination (10 / 20 / 50 / Tout).
 * Sécurisé à 100% contre les valeurs undefined / null sur .trim().
 */
export default function OrderTrackingFilters(props = {}) {
  // Extraction ultrasécurisée avec garanties de type String
  const searchTerm = String(props.searchTerm ?? props.searchQuery ?? props.search ?? "");
  const setSearchTerm = props.setSearchTerm || props.onSearchChange || (() => {});

  const statusFilter = String(props.statusFilter ?? props.status ?? "ALL");
  const setStatusFilter = props.setStatusFilter || props.onStatusChange || (() => {});

  const paymentFilter = String(props.paymentFilter ?? props.paymentMethod ?? "ALL");
  const setPaymentFilter = props.setPaymentFilter || props.onPaymentChange || (() => {});

  const deliveryDateFilter = String(props.deliveryDateFilter ?? props.dateFilter ?? props.selectedDate ?? "");
  const setDeliveryDateFilter = props.setDeliveryDateFilter || props.setDateFilter || props.onDateChange || (() => {});

  const sortBy = String(props.sortBy ?? "createdAt");
  const setSortBy = props.setSortBy || (() => {});

  const sortOrder = String(props.sortOrder ?? "desc");
  const setSortOrder = props.setSortOrder || (() => {});

  const itemsPerPage = props.itemsPerPage ?? 10;
  const setItemsPerPage = props.setItemsPerPage || (() => {});

  const setCurrentPage = props.setCurrentPage || (() => {});
  const onResetFilters = props.onResetFilters || props.resetFilters || (() => {});

  const totalFilteredCount = props.totalFilteredCount ?? props.filteredCount ?? 0;
  const totalCount = props.totalCount ?? props.totalItems ?? 0;

  // Évaluation sécurisée des filtres actifs
  const hasActiveFilters = 
    searchTerm.trim() !== "" || 
    statusFilter !== "ALL" || 
    paymentFilter !== "ALL" || 
    deliveryDateFilter.trim() !== "" || 
    sortBy !== "createdAt" || 
    sortOrder !== "desc";

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePaymentChange = (e) => {
    setPaymentFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDeliveryDateChange = (e) => {
    setDeliveryDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleItemsPerPageChange = (qty) => {
    setItemsPerPage(qty);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs text-xs font-sans text-slate-800">
      {/* 1. LIGNE SUPÉRIEURE : Recherche & Sélecteur d'éléments par page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Champ de Recherche */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Rechercher par N° commande, client, produit..."
            className="w-full pl-9 pr-8 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
          {searchTerm !== "" && (
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded-full cursor-pointer transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sélecteur Lignes par Page (10 / 20 / 50 / Tout) */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Rows size={13} className="text-emerald-700" /> Afficher :
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            {[10, 20, 50, "ALL"].map((qty) => {
              const isSelected = itemsPerPage === qty || (qty === "ALL" && itemsPerPage === 999999);
              return (
                <button
                  key={qty}
                  type="button"
                  onClick={() => handleItemsPerPageChange(qty === "ALL" ? 999999 : qty)}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {qty === "ALL" ? "Tout" : qty}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. LIGNE INFÉRIEURE : Filtres Déroulants & Tri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
        
        {/* Filtre Statut */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-700" /> Statut
          </label>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="paid">Payé / En cours</option>
            <option value="preparing">En préparation maraîchère</option>
            <option value="delivered">Livré</option>
          </select>
        </div>

        {/* Filtre Règlement */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CreditCard size={12} className="text-emerald-700" /> Règlement
          </label>
          <select
            value={paymentFilter}
            onChange={handlePaymentChange}
            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tous les modes</option>
            <option value="stripe_b2b">Stripe B2B (Carte/SEPA)</option>
            <option value="mandat_public">Mandat Chorus Pro (B2G)</option>
            <option value="virement_b2b">Virement B2B (LME 30j)</option>
          </select>
        </div>

        {/* Filtre Date de Livraison */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} className="text-emerald-700" /> Date Livraison
          </label>
          <input
            type="date"
            value={deliveryDateFilter}
            onChange={handleDeliveryDateChange}
            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Option de Tri */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown size={12} className="text-emerald-700" /> Trier par
          </label>
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={handleSortByChange}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="createdAt">Date d'achat</option>
              <option value="selectedDate">Date de livraison</option>
              <option value="totalTTC">Montant TTC</option>
              <option value="buyerName">Acheteur / Client</option>
            </select>
            <button
              type="button"
              onClick={toggleSortOrder}
              title={sortOrder === "asc" ? "Ordre croissant" : "Ordre décroissant"}
              className="p-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 rounded font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
            >
              {sortOrder === "asc" ? "▲" : "▼"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. LIGNE DE RÉCAPITULATIF & RÉINITIALISATION */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
        <span className="font-semibold text-slate-500">
          <strong className="text-slate-900">{totalFilteredCount}</strong> commande(s) affichée(s){" "}
          {totalFilteredCount !== totalCount && `(sur un total de ${totalCount})`}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Réinitialiser les filtres</span>
          </button>
        )}
      </div>
    </div>
  );
}

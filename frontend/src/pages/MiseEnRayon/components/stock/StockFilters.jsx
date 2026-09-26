import React from 'react';
import { Search, Filter } from 'lucide-react';

export function StockFilters({
  searchTerm,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  categoryFilter,
  onCategoryFilterChange
}) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un produit, référence, lot..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
        <div className="flex items-center gap-1 text-xs text-slate-500 font-bold mr-1">
          <Filter size={14} /> Filtres :
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="ALL">Toutes Catégories</option>
          <option value="ANE">🥦 Univers Âne (Maraîchage)</option>
          <option value="GORILLE">🦍 Univers Gorille (Artisanat)</option>
        </select>

        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="ALL">Tous les stocks</option>
          <option value="IN_STOCK">En stock (&gt; 0)</option>
          <option value="LOW_STOCK">Stock faible</option>
          <option value="OUT_OF_STOCK">Rupture de stock</option>
        </select>
      </div>
    </div>
  );
}
import React from "react";
import { Search, Filter } from "lucide-react";

export default function DocumentFilterBar({ docTypeFilter, setDocTypeFilter, searchQuery, setSearchQuery }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Rechercher par N° de pièce..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Filter size={14} className="text-slate-500" />
        <select
          value={docTypeFilter}
          onChange={(e) => setDocTypeFilter(e.target.value)}
          className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">Toutes les pièces</option>
          <option value="FACTURE">Factures Officielles</option>
          <option value="BON_COMMANDE">Bons de Commande</option>
        </select>
      </div>
    </div>
  );
}
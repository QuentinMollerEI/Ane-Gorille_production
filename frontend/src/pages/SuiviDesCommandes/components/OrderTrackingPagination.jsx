import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * 🛒 COMPOSANT : OrderTrackingPagination.jsx
 * Emplacement : src/pages/suivisDesCommandes/components/OrderTrackingPagination.jsx
 * Barre de navigation entre les pages avec indicateurs dynamiques.
 */
export default function OrderTrackingPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage
}) {
  if (totalItems === 0 || totalPages <= 1 || itemsPerPage === "ALL") {
    return (
      <div className="flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-500 font-medium">
        <span>Affichage de <strong>{totalItems}</strong> commande(s) au total</span>
        <span>Page 1 sur 1</span>
      </div>
    );
  }

  // Génération des numéros de pages
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-xs font-sans text-slate-700 shadow-xs">
      {/* Compteur d'éléments */}
      <span className="text-[11px] font-semibold text-slate-500 text-center sm:text-left">
        Affichage de <strong className="text-slate-900">{startIndex}</strong> à{" "}
        <strong className="text-slate-900">{endIndex}</strong> sur{" "}
        <strong className="text-slate-900">{totalItems}</strong> commandes
      </span>

      {/* Boutons de Navigation */}
      <div className="flex items-center justify-center gap-1">
        {/* Première page */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="Première page"
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Page précédente */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Page précédente"
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Numéros de page */}
        {getPageNumbers().map((num) => {
          const isActive = num === currentPage;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              className={`px-2.5 py-1 rounded text-xs font-black transition-all cursor-pointer border ${
                isActive
                  ? "bg-emerald-800 text-white border-emerald-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {num}
            </button>
          );
        })}

        {/* Page suivante */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Page suivante"
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight size={14} />
        </button>

        {/* Dernière page */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Dernière page"
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

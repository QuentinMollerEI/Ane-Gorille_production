import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * 📄 COMPOSANT : OrderTrackingPagination.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/OrderTrackingPagination.jsx
 * 
 * Responsabilité Unique (SRP) :
 * Barre de pagination et navigation par numéros de page.
 */
export default function OrderTrackingPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange
}) {
  if (totalPages <= 1 && itemsPerPage >= 999999) {
    return null;
  }

  const effectivePerPage = itemsPerPage >= 999999 ? totalItems : itemsPerPage;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectivePerPage + 1;
  const endItem = Math.min(currentPage * effectivePerPage, totalItems);

  // Calcul dynamique des numéros de pages affichés (fenêtre glissante de 5 pages)
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
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-slate-700 shadow-sm">
      {/* Information sur la plage d'éléments affichés */}
      <div className="text-[11px] text-slate-500 font-medium">
        Affichage de <strong className="text-slate-900 font-bold">{startItem}</strong> à <strong className="text-slate-900 font-bold">{endItem}</strong> sur <strong className="text-slate-900 font-bold">{totalItems}</strong> commande(s)
      </div>

      {/* Boutons de navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Première page */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            title="Première page"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Page précédente */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Page précédente"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline text-[11px]">Précédent</span>
          </button>

          {/* Numéros de pages */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onPageChange(num)}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentPage === num
                    ? "bg-emerald-800 text-white shadow-xs font-black"
                    : "text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Page suivante */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Page suivante"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span className="hidden sm:inline text-[11px]">Suivant</span>
            <ChevronRight size={14} />
          </button>

          {/* Dernière page */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Dernière page"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

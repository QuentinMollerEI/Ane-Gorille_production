import React from "react";
import { Search, Calendar } from "lucide-react";

export default function AccountingFilters({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  dateRange,
  setDateRange,
}) {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-150 self-start">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === "ALL"
                ? "bg-white text-gray-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Tous les flux
          </button>
          <button
            onClick={() => setSelectedType("B2G")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === "B2G"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Secteur Public (B2G)
          </button>
          <button
            onClick={() => setSelectedType("B2B")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === "B2B"
                ? "bg-white text-green-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Secteur Privé (B2B)
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par n° de facture, SIRET, engagement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" /> Filtrer par période
          comptable :
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            id="compta-start-date"
            name="compta-start-date"
            aria-label="Date de début"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-700"
          />
          <span className="text-gray-400 text-xs font-bold">à</span>
          <input
            type="date"
            id="compta-end-date"
            name="compta-end-date"
            aria-label="Date de fin"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white text-gray-700"
          />
        </div>

        {(dateRange.start || dateRange.end) && (
          <button
            onClick={() => setDateRange({ start: "", end: "" })}
            className="text-[10px] font-bold text-red-600 hover:text-red-700 border border-red-100 bg-red-50/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Réinitialiser les dates
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  CheckCircle,
  FileText,
  Truck,
} from "lucide-react";

export default function PrivateDocumentsTable({ documents }) {
  const [isRetracted, setIsRetracted] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = documents.filter((doc) => {
    // Consolidation des données pour une recherche globale (Date, N°, Type, Statut)
    const searchString = `${doc.date} ${doc.id} ${doc.type} ${
      doc.status === "paid" ? "payé stripe" : "classé archivé"
    }`.toLowerCase();

    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesFilter =
      docFilter === "all" ||
      (docFilter === "factures" && doc.type === "Facture") ||
      (docFilter === "bc" && doc.type === "Bon de commande") ||
      (docFilter === "bl" && doc.type === "Bon de livraison");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-gray-800" />
          Historique des Achats & Livraisons
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:bg-gray-100 p-1 rounded"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher (Date, N° Pièce, Type, Statut...)"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:ring-1 focus:ring-emerald-500"
              value={docFilter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les documents</option>
              <option value="factures">Factures</option>
              <option value="bc">Bons de commande</option>
              <option value="bl">Bons de livraison</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-gray-250 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Numéro & Type</th>
                  <th className="p-4">Montant TTC (TVA)</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Télécharger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 font-medium">
                      {doc.date}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{doc.id}</p>
                      <p className="text-xs text-gray-500 font-semibold">
                        {doc.type}
                      </p>
                    </td>
                    <td className="p-4 font-semibold text-gray-950">
                      {doc.amount !== null
                        ? `${Number(doc.amount).toFixed(2)} €`
                        : "-"}
                      {doc.vatRate !== undefined && doc.vatRate !== 0 && (
                        <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                          TVA : {doc.vatRate}%
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {doc.status === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle size={12} /> Payé (Stripe)
                        </span>
                      )}
                      {doc.status === "archived" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                          <CheckCircle size={12} /> Classé
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all">
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-gray-500 italic"
                    >
                      Aucun document ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

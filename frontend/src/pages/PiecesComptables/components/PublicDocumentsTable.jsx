import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Truck,
} from "lucide-react";

export default function PublicDocumentsTable({ documents }) {
  const [isRetracted, setIsRetracted] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = documents.filter((doc) => {
    // Consolidation des données pour une recherche globale (Date, N°, Type, Statut)
    const searchString =
      `${doc.date} ${doc.id} ${doc.type} ${doc.refEngagement || ""} ${
        doc.status === "paid"
          ? "payé"
          : doc.status === "pending_30d"
            ? "en transit"
            : doc.status === "pending_chorus"
              ? "attente mandat"
              : "classé archivé"
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
          <FileText size={18} className="text-emerald-600" />
          Dépôt Administratif, Logistique & Factur-X
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
              <option value="factures">Factures (Chorus)</option>
              <option value="bc">Bons d'engagement</option>
              <option value="bl">Bons de livraison</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-gray-250 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Émission</th>
                  <th className="p-4">N° Pièce / Type</th>
                  <th className="p-4">N° Engagement</th>
                  <th className="p-4">Montant TTC</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Téléchargements</th>
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
                    <td className="p-4 font-bold text-blue-700">
                      {doc.refEngagement !== "-" ? (
                        doc.refEngagement
                      ) : (
                        <span className="text-gray-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-950">
                      {doc.amount !== null
                        ? `${Number(doc.amount).toFixed(2)} €`
                        : "-"}
                    </td>
                    <td className="p-4">
                      {doc.status === "pending_chorus" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                          <RefreshCw size={12} className="animate-spin" />{" "}
                          Attente Mandat
                        </span>
                      )}
                      {doc.status === "pending_30d" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                          <Truck size={12} /> En transit
                        </span>
                      )}
                      {doc.status === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                          <CheckCircle size={12} /> Payé
                        </span>
                      )}
                      {doc.status === "archived" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                          <CheckCircle size={12} /> Classé
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all">
                        <Download size={15} />
                      </button>
                      {doc.isChorus && (
                        <button className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1.5 rounded-md transition-all shadow-sm">
                          Factur-X
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
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

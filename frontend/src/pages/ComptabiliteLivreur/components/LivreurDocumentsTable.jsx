import React, { useState } from "react";
import {
  FileText,
  Search,
  Download,
  CheckCircle,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function LivreurDocumentsTable({ documents = [] }) {
  const [isRetracted, setIsRetracted] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setFilter] = useState("all");

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.entity || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      docFilter === "all" ||
      (docFilter === "br" && doc.type === "Bon de Ramassage") ||
      (docFilter === "bl" && doc.type === "Bon de livraison") ||
      (docFilter === "presta" && doc.type === "Note de Course");

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
            <CheckCircle size={12} /> Réussi / Réglé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-700 rounded-full text-xs font-bold">
            <Clock size={12} /> En attente
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-full text-xs font-bold">
            Transmis
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Justificatifs Logistiques & Émargements Numériques
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-4 animate-fade-in">
          {/* Barre de recherche */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° de pièce, maraîcher, client..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-600"
              value={docFilter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les justificatifs</option>
              <option value="br">Bons de Ramassage (BR)</option>
              <option value="bl">Bons de livraison (BL)</option>
              <option value="presta">Notes de Course</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Émission</th>
                  <th className="p-4">N° Document / Type</th>
                  <th className="p-4">Acteur Tiers</th>
                  <th className="p-4">Volume (Frais de route)</th>
                  <th className="p-4">Statut Course</th>
                  <th className="p-4 text-right">Téléchargements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600 font-medium">
                        {doc.date}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{doc.id}</p>
                        <p className="text-xs text-gray-500 font-semibold">
                          {doc.type}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{doc.entity}</p>
                      </td>
                      <td className="p-4 font-semibold text-gray-950">
                        {doc.amountTTC
                          ? `${Number(doc.amountTTC).toFixed(2)} €`
                          : `${doc.weightKg} kg`}
                      </td>
                      <td className="p-4">{getStatusBadge(doc.status)}</td>
                      <td className="p-4 text-right">
                        <button
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all"
                          title="Télécharger le document d'émargement au format PDF"
                        >
                          <Download size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucune pièce de logistique trouvée.
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

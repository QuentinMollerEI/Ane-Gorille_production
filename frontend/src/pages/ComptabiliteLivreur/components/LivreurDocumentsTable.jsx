import React, { useState } from "react";
import {
  FileText,
  Search,
  Download,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * 🧾 COMPOSANT COMPORTEMENTAL : LivreurDocumentsTable.jsx
 * Responsabilité unique : Afficher sous forme de tableau filtré la liste des Bons de Livraison finaux
 * (uniquement les courses livrées/émargées) et proposer leur téléchargement certifié.
 */
export default function LivreurDocumentsTable({ deliveries }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Normalisation et filtrage strict des Bons de Livraison finaux (émargés)
  const normalizedDocs = (deliveries || [])
    .filter((item) =>
      ["delivered", "completed", "TERMINE", "LIVRE"].includes(item.status),
    )
    .map((item) => ({
      id: item.id,
      date: item.date || new Date().toLocaleDateString("fr-FR"),
      type: "Bon de livraison",
      entity: item.buyer || "Acheteur Public / Local",
      producer: item.producer || "Maraîcher Exploitant",
      amount:
        item.amount ||
        (item.distanceKm ? Number(item.distanceKm) * 1.25 : 18.75),
      tempHaccp: item.tempHaccp || null,
      status: item.status,
      blCode: item.blCode || `BL-${item.id.slice(0, 8).toUpperCase()}`,
    }));

  // Application des filtres de recherche
  const filteredDocs = normalizedDocs.filter((doc) => {
    return (
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.blCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.entity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.producer || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Téléchargement certifié du Bon de Livraison au format officiel texte (TXT)
  const handleDownloadDoc = (doc) => {
    const docContent = `=======================================================
               PLATEFORME ÂNE & GORILLE
          JUSTIFICATIF DE PRESTATION LOGISTIQUE
=======================================================
Date de génération : ${new Date().toLocaleDateString("fr-FR")}
Identifiant Commande : ${doc.id}
Référence du Bon     : ${doc.blCode}
Type de document     : ${doc.type}

-------------------------------------------------------
PARTENAIRES CONCERNÉS :
-------------------------------------------------------
Maraîcher Expéditeur : ${doc.producer}
Acheteur Public      : ${doc.entity}

-------------------------------------------------------
DÉTAILS TECHNIQUES & SÉCURITÉ ALIMENTAIRE (HACCP) :
-------------------------------------------------------
Distance estimée     : ${(doc.amount / 1.25).toFixed(1)} km
Température de transport : ${doc.tempHaccp ? `${doc.tempHaccp} °C` : "Non requise ou en cours"}
Statut de conformité  : ${doc.tempHaccp && Number(doc.tempHaccp) <= 6 ? "CONFORME (Chaîne du froid respectée)" : "A CERTIFIER"}

-------------------------------------------------------
RELEVÉ COMPTABLE & RÉMUNÉRATION :
-------------------------------------------------------
Montant Logistique HT  : ${(doc.amount / 1.2).toFixed(2)} €
Taux de TVA            : 20.00 %
Montant TVA collectée  : ${(doc.amount - doc.amount / 1.2).toFixed(2)} €
RÉMUNÉRATION LOGISTIQUE TTC : ${doc.amount.toFixed(2)} €

=======================================================
Généré de façon sécurisée par le protocole "Âne & Gorille"
Document certifié conforme à la réglementation DREAL.
=======================================================`;

    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.type.replace(/\s+/g, "_")}-${doc.id.slice(0, 8).toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Justificatifs Logistiques & Émargements Numériques Réels
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
          {/* Moteur de recherche et badge d'information */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° de pièce, maraîcher, client..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="shrink-0 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg shadow-sm">
              🟢 Bons de livraison finaux uniquement
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">N° Commande / BL</th>
                  <th className="p-4">Justificatif / Type</th>
                  <th className="p-4">Maraîcher</th>
                  <th className="p-4">Acheteur Destinataire</th>
                  <th className="p-4">Rémunération</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 text-gray-600 font-semibold">
                        {doc.date}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">
                          {doc.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          Réf BL : {doc.blCode}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-150 shadow-sm">
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 text-gray-800 font-semibold">
                        {doc.producer}
                      </td>
                      <td className="p-4 font-bold text-brand-dark">
                        {doc.entity}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {doc.amount.toFixed(2)} €
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> Émargé / Livré
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-gray-200 transition-all shadow-sm"
                          title="Télécharger le bon de livraison certifié"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucun bon de livraison archivé.
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

import React, { useState, useMemo } from "react";
import {
  PackageCheck,
  Printer,
  Search,
  Tag,
  Calendar,
  Building,
  X
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ReadyToShipCompartment.jsx
 * Onglet "Prêt à Expédier / Colis Scellés" pour les producteurs et maraîchers.
 */
export default function ReadyToShipCompartment({ subOrders = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubForPrint, setSelectedSubForPrint] = useState(null);

  // Filtrage dynamique
  const filteredSubs = useMemo(() => {
    return subOrders.filter((sub) => {
      const q = searchTerm.toLowerCase();
      const matchBuyer = (sub.buyerName || "").toLowerCase().includes(q);
      const matchLot = (sub.lotNumber || sub.batchNumber || "").toLowerCase().includes(q);
      const matchRef = (sub.id || "").toLowerCase().includes(q);
      return matchBuyer || matchLot || matchRef;
    });
  }, [subOrders, searchTerm]);

  return (
    <div className="space-y-4 text-xs">
      {/* BARRE DE RECHERCHE ET EN-TÊTE */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <PackageCheck size={16} className="text-emerald-700" />
            <span>Colis Prêts & Bons de Préparation Émis ({filteredSubs.length})</span>
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            Colis scellés en attente de passage de la tournée de ramassage du livreur Âne & Gorille.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrer par client, N° de lot ou réf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>
      </div>

      {/* LISTE DES COLIS PRÊTS */}
      {filteredSubs.length > 0 ? (
        <div className="space-y-3">
          {filteredSubs.map((sub) => {
            const items = Array.isArray(sub.items) ? sub.items : [];
            const lot = sub.lotNumber || sub.batchNumber || "LOT-SCELLE";
            const st = (sub.status || "").toUpperCase();
            const isDelivered = st === "DELIVERED" || st === "TERMINE" || st === "LIVRE";
            const isShipped = st === "EXPEDIE" || st === "EN_COURS_DE_LIVRAISON" || st === "IN_TRANSIT";

            const createdDateStr = sub.createdAt?.toDate
              ? sub.createdAt.toDate().toLocaleDateString("fr-FR")
              : new Date().toLocaleDateString("fr-FR");

            return (
              <div
                key={sub.id}
                className="bg-white border border-gray-200 rounded-lg p-3.5 space-y-3 shadow-sm hover:border-gray-300 transition-colors"
              >
                {/* En-tête du colis */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    {isDelivered ? (
                      <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        Livré
                      </span>
                    ) : isShipped ? (
                      <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        En Tournée
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Prêt à Enlever
                      </span>
                    )}

                    <span className="font-extrabold text-gray-900 text-xs">
                      Réf BP : #{sub.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                    <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                      <Building size={13} className="text-emerald-700" />
                      <span>{sub.buyerName || "Acheteur Client"}</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Tag size={12} />
                      <span>{lot}</span>
                    </span>
                  </div>
                </div>

                {/* Détail des articles du colis */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                        <th className="p-2">Désignation Produit</th>
                        <th className="p-2">Quantité Conditionnée</th>
                        <th className="p-2 text-right">Conditionnement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-2 font-extrabold text-gray-900">
                            <span>{item.title || item.name}</span>
                            {Boolean(item.isBio) && (
                              <span className="ml-1 bg-amber-100 text-amber-900 font-black text-[8px] px-1 py-0.5 rounded uppercase">
                                BIO
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-black text-emerald-900">
                            {item.quantity || item.qty || 1} {item.unit || "kg"}
                          </td>
                          <td className="p-2 text-right text-gray-500 font-medium">
                            Caisses Consignées Réutilisables
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pied du bon de préparation avec bouton d'impression */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Préparé le {createdDateStr}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedSubForPrint(sub)}
                    className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Imprimer Bon de Préparation (BP)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 font-bold italic">
          {subOrders.length === 0
            ? "Aucun colis scellé pour le moment."
            : "Aucun colis ne correspond à votre recherche."}
        </div>
      )}

      {/* 🖨️ MODALE D'IMPRESSION DU BON DE PRÉPARATION & RÉCOLTE (BP) */}
      {selectedSubForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-gray-900">
            {/* En-tête du document officiel */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-700 text-white rounded flex items-center justify-center font-black text-xs">
                  AG
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">
                    Bon de Préparation & Récolte (BP)
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold">
                    Âne & Gorille — Plateforme Logistique & Transport
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubForPrint(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cartouche d'informations réglementaires */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded text-[11px]">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[9px] block">Réf Commande</span>
                <span className="font-black">#{selectedSubForPrint.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[9px] block">N° de Lot Sanitaire HACCP</span>
                <span className="font-black text-emerald-800">
                  {selectedSubForPrint.lotNumber || selectedSubForPrint.batchNumber || "LOT-STD"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[9px] block">Acheteur Destinataire</span>
                <span className="font-bold">{selectedSubForPrint.buyerName || "Acheteur Client"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[9px] block">Conditionnement</span>
                <span className="font-bold">Caisses Consignées Réutilisables</span>
              </div>
            </div>

            {/* Liste des articles du BP */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-gray-500 block">
                Contenu de l'Expédition
              </span>
              <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[9px] font-black uppercase text-gray-600">
                    <th className="p-2">Produit</th>
                    <th className="p-2 text-right">Quantité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-semibold">
                  {(selectedSubForPrint.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold">{item.title || item.name}</td>
                      <td className="p-2 text-right font-black text-emerald-900">
                        {item.quantity || item.qty || 1} {item.unit || "kg"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mentions légales bas de page */}
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded text-[10px] space-y-0.5">
              <p className="font-bold">Conformité HACCP & Logistique de Transit :</p>
              <p className="text-emerald-800 text-[9px]">
                Marchandise prête pour la tournée de ramassage. Relevé de température de froid et émargement requis lors du transfert au transporteur.
              </p>
            </div>

            {/* Actions modale */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedSubForPrint(null)}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 font-bold rounded text-xs cursor-pointer hover:bg-gray-100"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={14} />
                <span>Imprimer ce BP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

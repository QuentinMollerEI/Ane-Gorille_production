import React from "react";
import { FileText, Download, ShieldCheck } from "lucide-react";
import { useAccountingDocuments } from "./hooks/useAccountingDocuments.js";
import DocumentFilterBar from "./components/DocumentFilterBar.jsx";
import { InvoiceGenerator } from "../../services/documents/InvoiceGenerator.js";
import { OrderSlipGenerator } from "../../services/documents/OrderSlipGenerator.js";

export default function PiecesComptables() {
  const {
    documents,
    loading,
    docTypeFilter,
    setDocTypeFilter,
    searchQuery,
    setSearchQuery
  } = useAccountingDocuments();

  const handleDownload = (docItem) => {
    if (docItem.docType === "FACTURE") {
      InvoiceGenerator.generateInvoice(docItem.rawOrder);
    } else {
      OrderSlipGenerator.generateOrderSlip(docItem.rawOrder);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-slate-500 animate-pulse">
        Chargement du livre comptable...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <FileText className="text-emerald-700" size={24} />
          Livre des Pièces Comptables B2B / Chorus Pro
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Téléchargez vos factures certifiées et bons de commande conformes à la loi LME.
        </p>
      </div>

      <DocumentFilterBar
        docTypeFilter={docTypeFilter}
        setDocTypeFilter={setDocTypeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
          <ShieldCheck size={48} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">Aucune pièce comptable disponible.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase">
                <th className="p-4">Type</th>
                <th className="p-4">Référence</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Montant TTC</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {documents.map((docItem) => (
                <tr key={docItem.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-emerald-800">
                    {docItem.docType === "FACTURE" ? "Facture Officielle" : "Bon de Commande"}
                  </td>
                  <td className="p-4 font-mono text-slate-900">{docItem.number}</td>
                  <td className="p-4 text-slate-500">{docItem.date}</td>
                  <td className="p-4 text-right font-black text-slate-900">
                    {docItem.amountTTC.toFixed(2)} €
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDownload(docItem)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      Télécharger PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
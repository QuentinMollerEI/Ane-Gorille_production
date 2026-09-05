import React from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Download,
  ExternalLink,
  Receipt,
} from "lucide-react";
import ChorusProStatus from "./ChorusProStatus";

export default function InvoiceCard({ invoice, isExpanded, onToggle }) {
  const calculateVatBreakdown = () => {
    let vat5_5 = 0;
    let vat20 = 0;

    invoice.items?.forEach((item) => {
      const qty = parseInt(item.quantityWanted || item.qty || 1, 10);
      const priceHT = parseFloat(item.priceHT || 0);
      const rate = parseFloat(item.vatRate || 5.5);
      const itemHT = priceHT * qty;
      const itemVAT = itemHT * (rate / 100);

      if (rate === 5.5) {
        vat5_5 += itemVAT;
      } else {
        vat20 += itemVAT;
      }
    });

    return { vat5_5, vat20 };
  };

  const vatBreakdown = calculateVatBreakdown();

  const handleDownloadInvoice = (type) => {
    alert(
      `Téléchargement de votre facture immuable au format ${type} en cours...`,
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden transition-all duration-200 hover:border-gray-300">
      <div
        onClick={onToggle}
        className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50/30 transition-colors select-none"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-black text-gray-800">
              N° FAC-{invoice.id.substring(0, 8).toUpperCase()}
            </span>

            {invoice.buyerProfile === "B2G" ? (
              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-1 rounded-full">
                Chorus Pro (B2G)
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-150 px-2.5 py-1 rounded-full">
                Billie 30j (B2B)
              </span>
            )}

            <span className="text-[9px] font-black uppercase tracking-wider bg-green-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <ShieldCheck size={11} /> Archivé
            </span>
          </div>

          <h3 className="text-sm font-black text-gray-900">
            {invoice.billingName || "Établissement Client"}
          </h3>

          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1">
              <Calendar size={13} />{" "}
              {invoice.createdAt
                ? new Date(
                    invoice.createdAt.seconds * 1000,
                  ).toLocaleDateString()
                : "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />{" "}
              {invoice.createdAt
                ? new Date(invoice.createdAt.seconds * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 self-end md:self-auto">
          <div className="text-left md:text-right">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
              Montant Total TTC
            </p>
            <p className="text-base font-black text-green-700 mt-1">
              {(invoice.totalTTC || 0).toFixed(2)} €
            </p>
          </div>
          <div className="p-1.5 border border-gray-200 rounded-xl bg-white text-gray-400 hover:text-gray-700 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-6 animate-slide-in">
          {invoice.buyerProfile === "B2G" && (
            <ChorusProStatus invoice={invoice} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 lg:col-span-2">
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <FileText size={14} className="text-green-700" /> Lignes de
                Facturation
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-400 font-black">
                      <th className="pb-2">Désignation</th>
                      <th className="pb-2 text-center">Qté</th>
                      <th className="pb-2 text-right">Prix HT</th>
                      <th className="pb-2 text-right">Total HT</th>
                      <th className="pb-2 text-right">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items?.map((item, idx) => {
                      const qty = parseInt(
                        item.quantityWanted || item.qty || 1,
                        10,
                      );
                      const price = parseFloat(item.priceHT || 0);
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 font-bold text-gray-900">
                            {item.title || item.name}
                          </td>
                          <td className="py-2.5 text-center font-extrabold">
                            {qty} {item.unit || "kg"}
                          </td>
                          <td className="py-2.5 text-right">
                            {price.toFixed(2)} €
                          </td>
                          <td className="py-2.5 text-right font-black text-gray-800">
                            {(price * qty).toFixed(2)} €
                          </td>
                          <td className="py-2.5 text-right font-semibold text-green-700">
                            {item.vatRate || 5.5}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Receipt size={14} className="text-green-700" /> Ventilation
                Fiscale (TVA)
              </h4>
              <div className="text-xs space-y-2.5">
                <div className="flex justify-between text-gray-500 font-semibold">
                  <span>Total HT :</span>
                  <span>{(invoice.totalHT || 0).toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-gray-500 font-semibold pl-2 border-l-2 border-green-200">
                  <span>Taux réduit 5.5% :</span>
                  <span>{vatBreakdown.vat5_5.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-gray-500 font-semibold pl-2 border-l-2 border-gray-200">
                  <span>Taux normal 20% :</span>
                  <span>{vatBreakdown.vat20.toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-gray-500 font-semibold border-t border-dashed pt-2">
                  <span>Total TVA cumulée :</span>
                  <span>{(invoice.totalTVA || 0).toFixed(2)} €</span>
                </div>

                <div className="flex justify-between text-gray-900 font-black border-t pt-2 text-sm">
                  <span>Total TTC payé :</span>
                  <span className="text-green-700">
                    {(invoice.totalTTC || 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-green-50/50 border border-green-150 p-4 rounded-2xl gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-green-950 flex items-center gap-1.5 justify-center sm:justify-start">
                <ShieldCheck className="text-green-700" size={16} />
                Document Certifié au standard Fiscal Européen (Factur-X)
              </p>
              <p className="text-[10px] text-green-900/80 font-medium leading-relaxed">
                Factur-X intègre l'empreinte XML directement dans la facture PDF
                pour permettre une importation automatisée dans Chorus Pro.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleDownloadInvoice("Factur-X (PDF + XML)")}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white font-black py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <Download size={13} />
                <span>Factur-X (PDF+XML)</span>
              </button>
              <button
                onClick={() => handleDownloadInvoice("Duplicata XML")}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border border-green-200 hover:bg-green-100 text-green-800 font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer bg-white"
              >
                <ExternalLink size={13} />
                <span>Metadata XML</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

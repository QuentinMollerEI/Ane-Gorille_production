import React, { useState } from "react";
import { Package, ShieldCheck, Thermometer, CheckCircle2, Calendar, FileText, UserCheck, AlertCircle, AlertTriangle } from "lucide-react";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";
import { formatFrenchDate, getCalculatedDeliveryDate } from "../../../utils/deliveryCalendar.js";

/**
 * 🚚 COMPOSANT : DeliveryLeg.jsx
 * Interface Livreur pour la remise physique des colis, saisie HACCP, émargement eIDAS, inscription des réserves et impression du BL.
 */
export default function DeliveryLeg({ deliveries = [], onConfirmDelivery, processingId }) {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [tempHaccp, setTempHaccp] = useState("4.0");
  const [recipientName, setRecipientName] = useState("");
  const [reservations, setReservations] = useState("");
  const [signatureData, setSignatureData] = useState("EMARGEMENT_NUMERIQUE_OK");

  const handleOpenModal = (deliv) => {
    setSelectedDelivery(deliv);
    setRecipientName(deliv.buyerName || "");
    setReservations("");
  };

  const handlePrintBL = (deliv) => {
    const html = OrderDocumentGenerator.generateDeliverySlipHTML(deliv);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    if (!tempHaccp) {
      alert("Le relevé de température HACCP est obligatoire.");
      return;
    }
    await onConfirmDelivery(
      selectedDelivery.parentOrderId, 
      tempHaccp, 
      signatureData, 
      recipientName,
      reservations
    );
    setSelectedDelivery(null);
  };

  if (deliveries.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
        Aucun colis actuellement en transit à livrer pour cette date.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans text-slate-800">
      <div className="grid grid-cols-1 gap-4">
        {deliveries.map((deliv) => {
          const rawDate = deliv.selectedDate || deliv.deliveryDate || deliv.subOrders?.[0]?.selectedDate;
          const reqDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
            ? rawDate
            : getCalculatedDeliveryDate(new Date());

          const formattedReqDate = formatFrenchDate(reqDate);

          return (
            <div
              key={deliv.parentOrderId}
              className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-sm hover:border-blue-300 transition-all"
            >
              {/* En-tête Livraison */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {deliv.buyerName} ({deliv.buyerProfile || "Client Pro"})
                  </span>
                  <p className="text-slate-500 text-[11px] font-medium">{deliv.deliveryAddress}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintBL(deliv)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Imprimer BL</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === deliv.parentOrderId}
                    onClick={() => handleOpenModal(deliv)}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <UserCheck size={14} />
                    <span>Valider la Remise Client</span>
                  </button>
                </div>
              </div>

              {/* BADGE DATE DE LIVRAISON SOUHAITÉE DÉSIGNÉE SUR LE BL */}
              <div className="bg-blue-50 border border-blue-300 rounded p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-700" />
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">
                      DATE DE LIVRAISON SOUHAITÉE DÉSIGNÉE SUR LE BL
                    </span>
                    <span className="text-xs font-black text-blue-950 capitalize">
                      {formattedReqDate} ({reqDate.split('-').reverse().join('/')})
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded">
                  {deliv.subOrders?.length || 1} colis maraîcher(s)
                </span>
              </div>

              {/* Détail des colis */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-slate-50/50 p-2 text-xs">
                {deliv.subOrders?.map((sub, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Origine : {sub.producerName || "Maraîcher"}</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-800">
                      Lot : {sub.lotNumber || "HACCP-OK"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE D'ÉMARGEMENT DU BL */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="text-blue-700" size={18} /> Remise Physique &amp; Émargement BL
              </h3>
              <p className="text-[11px] text-slate-500">
                Acheteur : <strong className="text-slate-900">{selectedDelivery.buyerName}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                  <Thermometer size={14} className="text-blue-700" /> Relevé Température HACCP Camion (°C) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ex: 4.2"
                  value={tempHaccp}
                  onChange={(e) => setTempHaccp(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px]">
                  Nom &amp; Prénom du Réceptionnaire Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marc Dupont"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                  <AlertTriangle size={13} className="text-amber-600" /> Inscription de Réserves Client (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 1 colis manquant chez le producteur X, 2 kg de tomates abîmés..."
                  value={reservations}
                  onChange={(e) => setReservations(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 font-medium">
                ✓ L'émargement tactile scellera le Bon de Livraison (BL) officiel avec la date du <strong>{formatFrenchDate(selectedDelivery.selectedDate || selectedDelivery.deliveryDate)}</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingId === selectedDelivery.parentOrderId}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded transition-colors cursor-pointer shadow-sm"
                >
                  Confirmer et Signer le BL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

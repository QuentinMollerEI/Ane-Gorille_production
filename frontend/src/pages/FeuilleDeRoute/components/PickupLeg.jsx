import React from "react";
import { Truck, CheckCircle2, FileText, Calendar, Phone, MapPin, Package } from "lucide-react";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";
import { formatFrenchDate, getCalculatedDeliveryDate } from "../../../utils/deliveryCalendar.js";

/**
 * 🚚 COMPOSANT : PickupLeg.jsx
 * Interface Livreur pour les haltes de ramassage chez les maraîchers.
 * Génère le Bon de Ramassage officiel et valide le chargement dans le camion.
 */
export default function PickupLeg({ pickups = [], onConfirmPickup, processingId }) {
  const handlePrintPickupSlip = (pickup) => {
    const html = OrderDocumentGenerator.generatePickupSlipHTML(pickup);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (pickups.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
        Aucune collecte chez les maraîchers programmée pour cette date.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans text-slate-800">
      <div className="grid grid-cols-1 gap-4">
        {pickups.map((pickup) => {
          const rawDate = pickup.subOrders?.[0]?.selectedDate || pickup.selectedDate;
          const reqDate = (rawDate && rawDate !== "Non spécifiée" && rawDate !== "")
            ? rawDate
            : getCalculatedDeliveryDate(new Date());

          const formattedReqDate = formatFrenchDate(reqDate);

          return (
            <div
              key={pickup.producerId}
              className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-sm hover:border-emerald-300 transition-all"
            >
              {/* En-tête Exploitation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Truck size={16} className="text-emerald-700" />
                    {pickup.producerName}
                  </span>
                  <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    {pickup.producerAddress}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintPickupSlip(pickup)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Bon de Ramassage</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === pickup.producerId}
                    onClick={() => onConfirmPickup(pickup.producerId, pickup.subOrders)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    <span>Valider Chargement Camion</span>
                  </button>
                </div>
              </div>

              {/* BADGE DATE DE LIVRAISON SOUHAITÉE POUR CETTE COLLECTE */}
              <div className="bg-emerald-50 border border-emerald-300 rounded p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-700" />
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                      DATE DE LIVRAISON CIBLE POUR LES COLIS ENLEVÉS
                    </span>
                    <span className="text-xs font-black text-emerald-950 capitalize">
                      {formattedReqDate} ({reqDate.split('-').reverse().join('/')})
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded font-mono">
                  {pickup.subOrders?.length || 1} colis maraîcher(s)
                </span>
              </div>

              {/* Liste des sous-commandes à charger */}
              <div className="space-y-1">
                <span className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Package size={12} className="text-emerald-700" /> Colis &amp; Cagettes à charger :
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-slate-50/50 p-2 text-xs">
                  {pickup.subOrders?.map((sub) => (
                    <div key={sub.id} className="py-1.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 font-mono">#{sub.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-slate-500 text-[11px] block">Destinataire : {sub.buyerName || "Acheteur"}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Lot : {sub.lotNumber || "HACCP-OK"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

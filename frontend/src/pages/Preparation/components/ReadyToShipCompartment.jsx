import React from "react";
import { Calendar, FileText, CheckCircle2, Box } from "lucide-react";
import { formatFrenchDate } from "../../../utils/deliveryCalendar.js";

/**
 * 📦 COMPOSANT : ReadyToShipCompartment.jsx
 * Emplacement : src/pages/Preparation/components/ReadyToShipCompartment.jsx
 * 
 * Tableau des produits prêts en cagette (Recalibré min-w-[750px]).
 */
export default function ReadyToShipCompartment({ orders, onPrintSlip }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium">
        Aucune commande prête en cagette pour le moment.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-x-auto w-full transition-all">
      <div className="min-w-[750px] w-full mx-auto">
        {/* EN-TÊTE TABLEAU UNIFIÉ */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
          <div className="w-[150px] shrink-0 text-left">Réf Colis &amp; Statut</div>
          <div className="w-[115px] shrink-0 text-center text-emerald-800 font-extrabold flex items-center justify-center gap-1">
            <span>Date Livraison</span>
          </div>
          <div className="w-[130px] shrink-0 text-left">Destinataire Client</div>
          <div className="w-[135px] shrink-0 text-center">N° Lot HACCP Attribué</div>
          <div className="w-[90px] shrink-0 text-center">Nbr Cagettes</div>
          <div className="w-[120px] shrink-0 text-center">Action Bon</div>
        </div>

        <div className="divide-y divide-slate-200">
          {orders.map((ord) => {
            const reqDate = ord.selectedDate || "Date en attente";

            return (
              <div
                key={ord.id}
                className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/90 transition-colors text-xs font-sans"
              >
                {/* Col 1 : Réf & Statut */}
                <div className="w-[150px] shrink-0 flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    #{ord.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={11} /> À Ramasser
                  </span>
                </div>

                {/* Col 2 : Date Livraison */}
                <div className="w-[115px] shrink-0 font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center justify-center gap-1 text-[11px] font-mono shadow-2xs">
                  <Calendar size={12} className="text-emerald-700 shrink-0" />
                  <span>{reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate}</span>
                </div>

                {/* Col 3 : Client Destinataire */}
                <div className="w-[130px] shrink-0 font-bold text-slate-900 truncate text-left" title={ord.buyerCompany || ord.buyerName}>
                  {ord.buyerCompany || ord.buyerName || "Acheteur Pro"}
                </div>

                {/* Col 4 : N° Lot HACCP */}
                <div className="w-[135px] shrink-0 font-mono font-bold text-emerald-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] text-center truncate">
                  {ord.lotNumber || "LOT-HACCP-OK"}
                </div>

                {/* Col 5 : Nbr Cagettes */}
                <div className="w-[90px] shrink-0 font-bold text-slate-700 flex items-center justify-center gap-1">
                  <Box size={13} className="text-emerald-700 shrink-0" />
                  <span>{ord.crateCount || 1} cagette(s)</span>
                </div>

                {/* Col 6 : Action Bon */}
                <div className="w-[120px] shrink-0 text-center">
                  <button
                    type="button"
                    onClick={() => onPrintSlip(ord)}
                    className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs justify-center w-full"
                  >
                    <FileText size={12} className="text-emerald-700" /> Imprimer Bon
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
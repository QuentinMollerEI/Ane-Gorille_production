import React, { useState } from "react";
import { Calendar, CheckCircle2, FileText, ChevronDown, ChevronRight, ShieldCheck, Thermometer } from "lucide-react";
import { formatFrenchDate } from "../../../utils/deliveryCalendar.js";

/**
 * 🌾 COMPOSANT : ToHarvestCompartment.jsx
 * Emplacement : src/pages/Preparation/components/ToHarvestCompartment.jsx
 */
export default function ToHarvestCompartment({ orders, onMarkAsReady, onOpenModal, onPrintSlip }) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [lotInputs, setLotInputs] = useState({});
  const [crateInputs, setCrateInputs] = useState({});

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleLotChange = (id, val) => {
    setLotInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleValidatePrep = (e, order) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const defaultLot = `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const lotNumber = lotInputs[order.id] || order.lotNumber || defaultLot;
    const crateCount = crateInputs[order.id] || order.crateCount || 1;

    if (typeof onMarkAsReady === "function") {
      onMarkAsReady(order.id, lotNumber, crateCount);
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium">
        Aucune commande en attente de récolte pour le moment.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-x-auto w-full transition-all">
      <div className="min-w-[750px] w-full mx-auto">
        {/* EN-TÊTE TABLEAU RECALIBRÉ */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
          <div className="w-[150px] shrink-0 text-left">Réf &amp; Statut</div>
          <div className="w-[115px] shrink-0 text-center text-emerald-800 font-extrabold flex items-center justify-center gap-1">
            <span>Date Livraison</span>
          </div>
          <div className="w-[130px] shrink-0 text-left">Acheteur Final</div>
          <div className="w-[60px] shrink-0 text-center">Articles</div>
          <div className="w-[135px] shrink-0 text-center">N° Lot HACCP</div>
          <div className="w-[120px] shrink-0 text-center">Action</div>
          <div className="w-[28px] shrink-0 text-right"></div>
        </div>

        {/* LIGNES DE COMMANDES */}
        <div className="divide-y divide-slate-200">
          {orders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const reqDate = ord.selectedDate || "Date en attente";
            const defaultLot = ord.lotNumber || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
            const currentLot = lotInputs[ord.id] !== undefined ? lotInputs[ord.id] : defaultLot;
            const isReady = ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(ord.status);

            return (
              <React.Fragment key={ord.id}>
                <div
                  onClick={() => toggleExpand(ord.id)}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/90 transition-colors cursor-pointer text-xs font-sans"
                >
                  {/* Col 1 : Réf & Statut */}
                  <div className="w-[150px] shrink-0 flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      #{ord.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${
                      isReady 
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {isReady ? "Prêt Cagette" : "À Cueillir"}
                    </span>
                  </div>

                  {/* Col 2 : Date Livraison */}
                  <div className="w-[115px] shrink-0 font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center justify-center gap-1 text-[11px] font-mono shadow-2xs">
                    <Calendar size={12} className="text-emerald-700 shrink-0" />
                    <span>{reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate}</span>
                  </div>

                  {/* Col 3 : Acheteur Final */}
                  <div className="w-[130px] shrink-0 font-bold text-slate-900 truncate text-left" title={ord.buyerCompany || ord.buyerName}>
                    {ord.buyerCompany || ord.buyerName || "Acheteur Pro"}
                  </div>

                  {/* Col 4 : Articles */}
                  <div className="w-[60px] shrink-0 text-center text-slate-700 font-extrabold">
                    {ord.items?.length || 0} art.
                  </div>

                  {/* Col 5 : N° Lot HACCP */}
                  <div className="w-[135px] shrink-0 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={currentLot}
                      onChange={(e) => handleLotChange(ord.id, e.target.value)}
                      placeholder="N° Lot HACCP"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-0.5 font-mono text-[11px] font-extrabold text-emerald-900 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Col 6 : Action Récolte */}
                  <div className="w-[120px] shrink-0 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleValidatePrep(e, ord)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs w-full justify-center"
                    >
                      <CheckCircle2 size={12} /> Prêt Cagette
                    </button>
                  </div>

                  {/* Col 7 : Chevron */}
                  <div className="w-[24px] shrink-0 text-right text-slate-400 hover:text-emerald-700 cursor-pointer">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* VOLET DÉPLIABLE DE DÉTAIL */}
                {isExpanded && (
                  <div className="bg-slate-50/90 p-4 border-t border-slate-200 space-y-4">
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Thermometer size={16} className="text-amber-700 shrink-0" />
                        <span>
                          Température : <strong className="text-amber-900">+2°C à +4°C (Chaîne du Froid)</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                        <span>Emballages Réutilisables Consignés (Loi AGEC)</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {typeof onOpenModal === "function" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenModal(ord);
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <FileText size={14} />
                            <span>📋 Ouvrir Bon de Préparation Interactif</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onPrintSlip === "function") onPrintSlip(ord);
                          }}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <FileText size={14} className="text-emerald-700" />
                          <span>Imprimer Bon A4</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Produit à Récolter</th>
                            <th className="p-2.5 text-center">Quantité Commandée</th>
                            <th className="p-2.5">Conditionnement Exigé</th>
                            <th className="p-2.5 text-right">Unité / Prix HT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(ord.items || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">
                                {item.name || item.title}
                              </td>
                              <td className="p-2.5 text-center font-black text-emerald-800 font-mono text-sm">
                                {item.quantity || item.qty} {item.unit || "kg"}
                              </td>
                              <td className="p-2.5 text-slate-600">
                                Cagette Plastique Pro Consignée (HACCP)
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                                {Number(item.priceHT || item.price || 0).toFixed(2)} € HT / {item.unit || "kg"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
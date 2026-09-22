import React from "react";
import { Calendar, FileText, Printer, ChevronDown, ChevronRight } from "lucide-react";
import { OrderSlipGenerator } from "../../../services/documents/OrderSlipGenerator";
import { DeliverySlipGenerator } from "../../../services/documents/DeliverySlipGenerator";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";
import { formatFrenchDate, getCalculatedDeliveryDate } from "../../../utils/deliveryCalendar.js";
import TrackingStepper from "./TrackingStepper";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";
import TrackingFinancialSummary from "./TrackingFinancialSummary";

/**
 * 📦 COMPOSANT : OrderTrackingCard.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/OrderTrackingCard.jsx
 * 
 * Responsabilité Unique (SRP) :
 * Rendre une ligne de commande individuelle dans la table réactive (8 colonnes alignées 1-à-1)
 * et son accordéon dépliable (Stepper, Sub-Orders, Synthèse Financière, Documents).
 */
export default function OrderTrackingCard({
  order,
  subOrders = [],
  isExpanded = false,
  onToggleExpand
}) {
  if (!order) return null;

  // Filtre les sous-commandes de cette commande parente
  const associatedSubs = subOrders.filter(
    (s) => s.parentOrderId === order.id || s.orderId === order.id
  );

  // Date de livraison souhaitée
  const rawDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate;
  const reqDate = (rawDate && rawDate !== "Date en attente" && rawDate !== "")
    ? rawDate
    : getCalculatedDeliveryDate(order.createdAt?.toDate ? order.createdAt.toDate() : new Date());

  const formattedReqDate = formatFrenchDate(reqDate);

  // Impression Bon de Commande
  const handlePrintOrderSlip = (e) => {
    e.stopPropagation();
    let html = "";
    if (OrderSlipGenerator && typeof OrderSlipGenerator.generateHTML === "function") {
      html = OrderSlipGenerator.generateHTML(order);
    } else {
      html = OrderDocumentGenerator.generateOrderSlipHTML(order);
    }

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // Impression Bon de Livraison (BL)
  const handlePrintDeliverySlip = (e) => {
    e.stopPropagation();
    const html = DeliverySlipGenerator && typeof DeliverySlipGenerator.generateHTML === "function" ? DeliverySlipGenerator.generateHTML(order) : OrderDocumentGenerator.generateDeliverySlipHTML(order);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      {/* 1. LIGNE DE DONNÉES DE TABLEAU (8 COLONNES ALIGNÉES STRICTEMENT) */}
      <div
        onClick={() => onToggleExpand(order.id)}
        className="flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/90 transition-colors cursor-pointer text-xs font-sans"
      >
        {/* Col 1 : Réf Commande & Statut (w-[190px] shrink-0) */}
        <div className="w-[190px] shrink-0 flex items-center gap-2">
          <span className="font-extrabold text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            #{order.orderNumber || order.id?.substring(0, 8).toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
            order.status === 'paid' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            {order.status === 'delivered' ? 'Livré' : order.status === 'paid' ? 'Payé' : 'En cours'}
          </span>
        </div>

        {/* Col 2 : Date Commande (w-[100px] shrink-0) */}
        <div className="w-[100px] shrink-0 text-slate-600 font-medium text-[11px]">
          {order.createdAt?.toDate 
            ? order.createdAt.toDate().toLocaleDateString('fr-FR')
            : (order.createdAt ? String(order.createdAt).split('T')[0] : new Date().toLocaleDateString('fr-FR'))}
        </div>

        {/* Col 3 : Date Livraison Souhaitée - Badge Vert (w-[130px] shrink-0) */}
        <div className="w-[130px] shrink-0 font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/90 flex items-center gap-1.5 text-[11px] font-mono shadow-2xs">
          <Calendar size={13} className="text-emerald-700 shrink-0" />
          <span>
            {reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate}
          </span>
        </div>

        {/* Col 4 : Client / Acheteur (w-[140px] shrink-0) */}
        <div className="w-[140px] shrink-0 font-bold text-slate-900 truncate" title={order.buyerName}>
          {order.buyerName || 'Acheteur Pro'}
        </div>

        {/* Col 5 : Articles (w-[60px] shrink-0 text-center) */}
        <div className="w-[60px] shrink-0 text-center text-slate-700 font-extrabold">
          {order.items?.length || 0} art.
        </div>

        {/* Col 6 : Règlement (w-[110px] shrink-0) */}
        <div className="w-[110px] shrink-0 text-slate-600 truncate text-[11px] font-medium">
          {order.paymentMethod === 'mandat_public' ? 'Mandat Chorus' : order.paymentMethod === 'virement_b2b' ? 'Virement 30j' : 'Stripe B2B'}
        </div>

        {/* Col 7 : Total TTC (w-[100px] shrink-0 text-right) */}
        <div className="w-[100px] shrink-0 text-right font-black text-slate-900 font-mono text-[12px]">
          {Number(order.totalTTC || order.totalAmount || order.amountTTC || order.amount || 0).toFixed(2)} €
        </div>

        {/* Col 8 : Chevron Expand (w-[28px] shrink-0 text-right) */}
        <div className="w-[28px] shrink-0 text-right text-slate-400 hover:text-emerald-700">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* 2. ACCORDÉON DÉPLIABLE DÉTAILLÉ */}
      {isExpanded && (
        <div className="bg-slate-50/80 p-4 border-t border-slate-200 space-y-4 animate-fade-in">
          {/* Bandeau Supérieur : Date de Livraison Cible & Impressions */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-700 text-white rounded-lg shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  DATE DE LIVRAISON SOUHAITÉE PAR L'ACHETEUR
                </span>
                <span className="text-sm font-black text-emerald-950 capitalize">
                  {formattedReqDate} ({reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintOrderSlip}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <FileText size={14} className="text-emerald-700" />
                <span>Bon de Commande</span>
              </button>

              {order.status === "delivered" && (
                <button
                  type="button"
                  onClick={handlePrintDeliverySlip}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Bon de Livraison (BL)</span>
                </button>
              )}
            </div>
          </div>

          {/* Stepper d'avancement de la commande */}
          <TrackingStepper status={order.status} />

          {/* Avancement par maraîcher */}
          <TrackingSubOrderDetails subOrders={associatedSubs} />

          {/* Synthèse Financière Consolidée */}
          <TrackingFinancialSummary order={order} subOrders={associatedSubs} />
        </div>
      )}
    </div>
  );
}

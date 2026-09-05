import React from "react";
import { Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import TrackingStepper from "./TrackingStepper";
import TrackingFinancialSummary from "./TrackingFinancialSummary";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";

/**
 * 💳 COMPOSANT : OrderTrackingCard.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/components/OrderTrackingCard.jsx
 * Responsabilité unique : Modéliser l'enveloppe extérieure d'une commande (carte collapsible).
 * Orchestre et assemble la frise de workflow (stepper), le résumé financier et le suivi par producteur.
 */
export default function OrderTrackingCard({
  order,
  workflow,
  associatedSubs,
  isExpanded,
  onToggle,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden transition-all duration-200 hover:border-gray-300">
      {/* En-tête de Carte (Aperçu rapide interactif) */}
      <div
        onClick={onToggle}
        className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50/40 transition-colors select-none"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-black text-gray-800">
              #{order.orderId || order.id.substring(0, 8)}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${workflow.color}`}
            >
              {workflow.label}
            </span>
            {order.buyerProfile === "B2G" && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Secteur Public (B2G)
              </span>
            )}
          </div>

          <h3 className="text-sm font-black text-gray-900">
            {order.billingName || "Acheteur Professionnel"}
          </h3>

          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1">
              <Calendar size={13} />{" "}
              {order.createdAt
                ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                : "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />{" "}
              {order.createdAt
                ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Prix global de la facture et action de déploiement */}
        <div className="flex items-center gap-5 self-end md:self-auto">
          <div className="text-left md:text-right">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
              Montant Payé
            </p>
            <p className="text-base font-black text-green-700 mt-1">
              {(order.totalTTC || 0).toFixed(2)} € TTC
            </p>
          </div>
          <div className="p-1.5 border border-gray-200 rounded-xl bg-white text-gray-400 hover:text-gray-700 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Frise chronologique logistique (Toujours visible pour un suivi rapide) */}
      <TrackingStepper workflow={workflow} />

      {/* Détails enrichis dépliables (Section collapsible) */}
      {isExpanded && (
        <div className="p-6 bg-gray-50/50 space-y-6 border-t border-gray-100 animate-slide-in">
          {/* Compartiments Financiers et Administratifs */}
          <TrackingFinancialSummary order={order} />

          {/* Compartiment de suivi par maraîcher */}
          <TrackingSubOrderDetails associatedSubs={associatedSubs} />
        </div>
      )}
    </div>
  );
}

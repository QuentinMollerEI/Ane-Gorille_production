import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, Truck, CheckCircle } from "lucide-react";
import TrackingStepper from "./TrackingStepper";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";
import TrackingFinancialSummary from "./TrackingFinancialSummary";

/**
 * 🌾 COMPOSANT : OrderTrackingCard.jsx
 * Carte individuelle représentant une commande globale avec accordéon de détails.
 */
export default function OrderTrackingCard({ order, onConfirmDelivery }) {
  const [expanded, setExpanded] = useState(false);

  if (!order) return null;

  const orderId = order.id || order.orderNumber || "CMD-STD";
  const orderRef = order.orderNumber || `CMD-${orderId.substring(0, 8).toUpperCase()}`;
  const createdAt = order.createdAt
    ? new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Récemment";

  const status = order.status || "paid";
  const buyerName = order.buyerName || order.companyName || order.userName || "Client Professionnel";
  const totalTTC = Number(order.totalTTC ?? order.amountTTC ?? 0);
  const itemCount = (order.items || []).reduce((acc, i) => acc + Number(i.quantity || 1), 0);

  const getStatusBadge = (st) => {
    switch (st) {
      case "pending":
      case "paid":
        return <span className="bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">Payée</span>;
      case "preparing":
      case "harvesting":
        return <span className="bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">En Récolte</span>;
      case "ready_for_pickup":
      case "ready_to_ship":
        return <span className="bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">Colis Scellé</span>;
      case "in_transit":
      case "shipping":
        return <span className="bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">En Livraison</span>;
      case "delivered":
        return <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">Livrée</span>;
      case "cancelled":
        return <span className="bg-red-100 text-red-900 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">Annulée</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 font-extrabold px-2.5 py-0.5 rounded-full">{st}</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-xs">
      {/* En-tête de la carte */}
      <div className="p-4 bg-gray-50/70 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Package size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm tracking-tight">{orderRef}</h3>
                {getStatusBadge(status)}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} />
                <span>Commandé le {createdAt}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Montant Total</span>
              <span className="text-base font-black text-emerald-900">{totalTTC.toFixed(2)} € TTC</span>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-gray-700 flex items-center gap-1 font-bold shadow-2xs"
            >
              <span>{expanded ? "Masquer" : "Détails"}</span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Repères rapides : Client & Articles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60 text-[11px] text-gray-600 font-semibold">
          <span className="flex items-center gap-1">
            <User size={13} className="text-emerald-700" />
            <span>Acheteur : <strong>{buyerName}</strong></span>
          </span>

          <span className="flex items-center gap-1">
            <Package size={13} className="text-emerald-700" />
            <span>{itemCount} article(s) commandé(s)</span>
          </span>
        </div>

        {/* Stepper d'avancement */}
        <div className="pt-2 border-t border-gray-200/80">
          <TrackingStepper status={status} />
        </div>
      </div>

      {/* Accordéon repliable avec détails complets */}
      {expanded && (
        <div className="p-4 space-y-4 animate-fade-in bg-white">
          {/* Sous-commandes par maraîcher */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
              <Truck size={15} className="text-emerald-700" />
              <span>Répartition par Exploitation & Traçabilité HACCP</span>
            </h4>
            <TrackingSubOrderDetails subOrders={order.subOrders} items={order.items} />
          </div>

          {/* Synthèse financière */}
          <TrackingFinancialSummary order={order} />

          {/* Actions spécifiques */}
          {status === "in_transit" && onConfirmDelivery && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
              <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                <Truck size={15} className="text-amber-700" />
                <span>Le livreur est en tournée. Confirmez la réception dès livraison.</span>
              </span>
              <button
                onClick={() => onConfirmDelivery(order.id)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <CheckCircle size={14} />
                <span>Confirmer la Réception</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

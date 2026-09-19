import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, Truck } from "lucide-react";
import TrackingStepper from "./TrackingStepper";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";
import TrackingFinancialSummary from "./TrackingFinancialSummary";

/**
 * 🌾 COMPOSANT : OrderTrackingCard.jsx
 * Ligne moderne de commande avec tiroir dépliable au clic.
 */
export default function OrderTrackingCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  if (!order) return null;

  const orderId = order.id || order.orderNumber || "CMD-STD";
  const orderRef = order.orderNumber || `#CMD-${orderId.substring(0, 8).toUpperCase()}`;
  const createdAt = order.createdAt
    ? new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Récemment";

  const status = order.status || "paid";
  const buyerName = order.buyerName || order.companyName || order.userName || "Client Professionnel";
  
  // Calcul dynamique du total TTC et du nombre d'articles
  const itemsSubtotalHT = (order.items || []).reduce(
    (sum, item) => sum + Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1),
    0
  );
  const rawTotalHT = Number(order.totalHT ?? order.amountHT ?? order.priceHT ?? 0);
  const totalHT = rawTotalHT > 0 ? rawTotalHT : itemsSubtotalHT;
  
  let deliveryFee = Number(order.deliveryFee ?? order.shippingFee ?? 0);
  if (deliveryFee === 0 && totalHT < 300 && totalHT > 0) {
    deliveryFee = totalHT >= 150 ? 8 : 15;
  }
  const foodVAT = Number(order.foodVAT ?? (totalHT * 0.055));
  const deliveryFeeVAT = deliveryFee > 0 ? (deliveryFee * 0.20) : 0;
  const calculatedTotalTTC = totalHT + deliveryFee + foodVAT + deliveryFeeVAT;
  
  const rawTotalTTC = Number(order.totalTTC ?? order.amountTTC ?? 0);
  const totalTTC = (rawTotalTTC > 0 && Math.abs(rawTotalTTC - calculatedTotalTTC) < 0.1) 
    ? rawTotalTTC 
    : calculatedTotalTTC;

  const itemCount = (order.items || []).reduce((acc, i) => acc + Number(i.quantity ?? i.qty ?? 1), 0);
  const payMethod = order.paymentMethod || "stripe_b2b";

  const getStatusBadge = (st) => {
    const norm = String(st || "").toLowerCase();
    if (["pending", "paid", "a_preparer"].includes(norm)) {
      return <span className="bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-sky-200">Payée / À Préparer</span>;
    }
    if (["preparing", "harvesting", "en_preparation"].includes(norm)) {
      return <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-amber-200">En Récolte</span>;
    }
    if (["ready_for_pickup", "ready_to_ship", "a_ramasser", "pret_a_expedier"].includes(norm)) {
      return <span className="bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-purple-200">Colis Scellé</span>;
    }
    if (["in_transit", "shipping", "en_cours_de_livraison", "expedie"].includes(norm)) {
      return <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-indigo-200">En Livraison</span>;
    }
    if (["delivered", "livre", "termine"].includes(norm)) {
      return <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-sm text-[11px] border border-emerald-200">Livrée</span>;
    }
    return <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-sm text-[11px]">{st}</span>;
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case "virement_b2b":
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm border border-slate-200 font-semibold text-[10px]">Virement 30j</span>;
      case "mandat_public":
        return <span className="bg-sky-50 text-sky-900 px-2 py-0.5 rounded-sm border border-sky-200 font-semibold text-[10px]">Mandat Public</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-sm border border-emerald-200 font-semibold text-[10px]">Carte CB / SEPA</span>;
    }
  };

  const isShipped = ["in_transit", "shipping", "en_cours_de_livraison", "expedie"].includes(String(status).toLowerCase());

  return (
    <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
      {/* Ligne Synthétique d'une commande */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="font-mono font-bold text-slate-900 text-xs tracking-tight">
            {orderRef}
          </div>
          {getStatusBadge(status)}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500 font-medium hidden md:block">
            {createdAt}
          </div>

          <div className="font-semibold text-slate-800 min-w-[140px] truncate">
            {buyerName}
          </div>

          <div className="text-slate-600 font-medium hidden sm:block">
            {itemCount} art.
          </div>

          <div>
            {getPaymentBadge(payMethod)}
          </div>

          <div className="font-mono font-bold text-slate-900 text-sm text-right min-w-[90px]">
            {totalTTC.toFixed(2)} € TTC
          </div>

          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Tiroir détaillé au clic */}
      {expanded && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/40 space-y-4 animate-fade-in text-xs">
          {/* Stepper de progression */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Progression Logistique
            </span>
            <TrackingStepper
              status={status}
              paymentMethod={payMethod}
              refEngagement={order.refEngagement}
            />
          </div>

          {/* Répartition par exploitation & Traçabilité HACCP (Strictement lié à cet orderId) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Exploitations Agricoles & Traçabilité Sanitaire
            </span>
            <TrackingSubOrderDetails subOrders={order.subOrders} items={order.items} orderId={order.id} />
          </div>

          {/* Synthèse financière */}
          <div>
            <TrackingFinancialSummary order={order} />
          </div>

          {/* Information logistique de livraison (Seul le livreur valide à la livraison physique) */}
          {isShipped && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-sm flex items-center gap-2 text-[11px] text-indigo-950 font-medium">
              <Truck size={16} className="text-indigo-700 shrink-0" />
              <span>
                <strong>Commande en cours de livraison :</strong> Le livreur Âne & Gorille validera la réception avec vous lors de la remise physique et de la signature du Bon de Livraison (BL).
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Calendar, User, Truck, CheckCircle, CreditCard, Building, FileText } from "lucide-react";
import TrackingStepper from "./TrackingStepper";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";
import TrackingFinancialSummary from "./TrackingFinancialSummary";

/**
 * 🌾 FONCTION UNIVERSELLE DE CALCUL DU PRIX TOTAL TTC
 */
export function calculateOrderTotalTTC(order) {
  if (!order) return 0;

  const directAmount = Number(
    order.totalTTC ?? 
    order.amountTTC ?? 
    order.totalAmount ?? 
    order.amount ?? 
    order.total ?? 
    order.price ?? 
    0
  );
  if (directAmount > 0) return directAmount;

  const totalHT = Number(order.totalHT ?? order.amountHT ?? order.priceHT ?? 0);
  if (totalHT > 0) {
    const vat = Number(order.totalVAT ?? order.vatAmount ?? (totalHT * 0.055));
    const shipping = Number(order.deliveryFee ?? order.shippingFee ?? 0);
    return totalHT + vat + shipping;
  }

  const items = Array.isArray(order.items) ? order.items : Array.isArray(order.products) ? order.products : [];
  if (items.length > 0) {
    const itemsTotalHT = items.reduce((sum, item) => {
      const price = Number(item.priceHT ?? item.price ?? item.unitPrice ?? 0);
      const qty = Number(item.quantity ?? item.qty ?? 1);
      return sum + (price * qty);
    }, 0);
    if (itemsTotalHT > 0) return itemsTotalHT * 1.055;
  }

  const subOrders = Array.isArray(order.subOrders) ? order.subOrders : [];
  if (subOrders.length > 0) {
    const subsTotal = subOrders.reduce((sum, sub) => {
      const subAmt = Number(sub.amountTTC ?? sub.amount ?? sub.totalAmount ?? (Number(sub.amountHT || 0) * 1.055) ?? 0);
      return sum + subAmt;
    }, 0);
    if (subsTotal > 0) return subsTotal;
  }

  return 0;
}

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
  const paymentMethod = order.paymentMethod || "stripe_b2b";
  const refEngagement = order.refEngagement || "-";
  const buyerName = order.buyerName || order.companyName || order.userName || "Client Professionnel";

  const totalTTC = calculateOrderTotalTTC(order);
  const items = Array.isArray(order.items) ? order.items : Array.isArray(order.products) ? order.products : [];
  const itemCount = items.reduce((acc, i) => acc + Number(i.quantity || i.qty || 1), 0);

  const isMandat = paymentMethod === "mandat_public" || paymentMethod === "mandat" || order.buyerRole === "acheteur_public";
  const isVirement = paymentMethod === "virement_b2b" || paymentMethod === "virement" || status === "EN_ATTENTE_VIREMENT";

  const getStatusBadge = (st) => {
    switch (st) {
      case "pending":
      case "paid":
      case "A_PREPARER":
        return <span className="bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">Payée / En Attente</span>;
      case "EN_ATTENTE_VIREMENT":
        return <span className="bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">Attente Virement (30j)</span>;
      case "preparing":
      case "harvesting":
      case "EN_PREPARATION":
        return <span className="bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">En Récolte</span>;
      case "ready_for_pickup":
      case "ready_to_ship":
      case "A_RAMASSER":
      case "PRET_A_EXPEDIER":
        return <span className="bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">Commande Prête</span>;
      case "in_transit":
      case "shipping":
      case "EXPEDIE":
      case "EN_COURS_DE_LIVRAISON":
        return <span className="bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">En Livraison</span>;
      case "delivered":
      case "LIVRE":
      case "TERMINE":
        return <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">Livrée</span>;
      case "cancelled":
        return <span className="bg-red-100 text-red-900 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">Annulée</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 font-extrabold px-2.5 py-0.5 rounded-full">{st}</span>;
    }
  };

  const getPaymentBadge = () => {
    if (isMandat) {
      return (
        <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
          <FileText size={11} className="text-blue-700" />
          <span>Chorus Pro {refEngagement !== "-" ? `(Eng. ${refEngagement})` : "(Mandat Public)"}</span>
        </span>
      );
    }
    if (isVirement) {
      return (
        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
          <Building size={11} className="text-amber-700" />
          <span>Virement B2B (Différé 30j LME)</span>
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
        <CreditCard size={11} className="text-emerald-700" />
        <span>Carte CB / SEPA (Stripe)</span>
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-xs">
      <div className="p-4 bg-gray-50/70 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Package size={18} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-gray-900 text-sm tracking-tight font-mono">{orderRef}</h3>
                {getStatusBadge(status)}
                {getPaymentBadge()}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                <Calendar size={12} />
                <span>Commandé le {createdAt}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Montant Total</span>
              <span className="text-base font-black text-emerald-900 font-mono">{totalTTC.toFixed(2)} € TTC</span>
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60 text-[11px] text-gray-600 font-semibold">
          <span className="flex items-center gap-1">
            <User size={13} className="text-emerald-700" />
            <span>Acheteur : <strong>{buyerName}</strong></span>
          </span>

          <span className="flex items-center gap-1 font-mono">
            <Package size={13} className="text-emerald-700" />
            <span>{itemCount} article(s) commandé(s)</span>
          </span>
        </div>

        <div className="pt-2 border-t border-gray-200/80">
          <TrackingStepper
            status={status}
            paymentMethod={paymentMethod}
            refEngagement={refEngagement}
          />
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4 animate-fade-in bg-white">
          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
              <Truck size={15} className="text-emerald-700" />
              <span>Répartition par Exploitation & Traçabilité HACCP</span>
            </h4>
            <TrackingSubOrderDetails subOrders={order.subOrders} items={order.items} />
          </div>

          <TrackingFinancialSummary order={order} />

          {(status === "in_transit" || status === "EN_COURS_DE_LIVRAISON" || status === "PRET_A_EXPEDIER") && onConfirmDelivery && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
              <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                <Truck size={15} className="text-amber-700" />
                <span>Le colis est prêt ou en tournée. Confirmez la réception dès livraison.</span>
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
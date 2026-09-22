import React, { useState, useEffect } from "react";
import { Package, Calendar, Printer, Truck, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { OrderSlipGenerator } from "../../services/documents/OrderSlipGenerator";
import { DeliverySlipGenerator } from "../../services/documents/DeliverySlipGenerator";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";
import { formatFrenchDate } from "../../utils/deliveryCalendar";

/**
 * 🚚 Calculateur universel des totaux financiers consolidés
 */
export function computeOrderTotals(order) {
  const items = order.items || [];
  const totalProductsHT = items.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const pHT = Number(item.priceHT ?? item.price ?? 0);
    return sum + (qty * pHT);
  }, 0);

  let deliveryFeeHT = Number(
    order.deliveryFee ?? 
    order.deliveryFeeHT ?? 
    order.shippingFee ?? 
    order.deliveryDetails?.deliveryFee ?? 
    -1
  );

  if (deliveryFeeHT < 0 || (deliveryFeeHT === 0 && totalProductsHT > 0 && totalProductsHT < 300)) {
    if (totalProductsHT >= 300) {
      deliveryFeeHT = 0;
    } else if (totalProductsHT >= 150) {
      deliveryFeeHT = 8;
    } else if (totalProductsHT > 0) {
      deliveryFeeHT = 15;
    } else {
      deliveryFeeHT = 0;
    }
  }

  const vatProducts = totalProductsHT * 0.055;
  const vatDelivery = deliveryFeeHT * 0.20;
  const totalVAT = vatProducts + vatDelivery;
  const totalTTC = totalProductsHT + deliveryFeeHT + totalVAT;

  return {
    totalProductsHT,
    deliveryFeeHT,
    vatProducts,
    vatDelivery,
    totalVAT,
    totalTTC
  };
}

/**
 * 🛒 COMPOSANT : SuiviDesCommandes.jsx
 * Espace Suivi de Commandes pour l'Acheteur Client.
 * Affiche la SYNTHÈSE FINANCIÈRE CONSOLIDÉE et la DATE DE LIVRAISON SOUHAITÉE.
 */
export default function SuiviDesCommandes() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const qOrders = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(data);
      },
      (err) => console.error("Erreur commandes :", err)
    );

    const qSubs = query(collection(db, "sub_orders"), where("buyerId", "==", user.uid));
    const unsubSubs = onSnapshot(
      qSubs,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur sous-commandes :", err);
        setError("Impossible de charger l'historique de vos commandes.");
        setLoading(false);
      }
    );

    return () => {
      unsubOrders();
      unsubSubs();
    };
  }, [user?.uid]);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handlePrintOrderSlip = (e, order) => {
    e.stopPropagation();
    const html = OrderSlipGenerator.generateHTML(order);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handlePrintDeliverySlip = (e, order) => {
    e.stopPropagation();
    const html = DeliverySlipGenerator && typeof DeliverySlipGenerator.generateHTML === "function" ? DeliverySlipGenerator.generateHTML(order) : (OrderDocumentGenerator.generateDeliverySlipHTML ? OrderDocumentGenerator.generateDeliverySlipHTML(order) : "");
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs font-semibold text-emerald-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        <span>Chargement de vos commandes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 text-xs font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-700" size={22} /> Suivi des Commandes Acheteur
          </h1>
          <p className="text-xs text-slate-500">
            Consultez le statut, la <strong className="text-slate-900">synthèse financière consolidée</strong> et la <strong className="text-slate-900">date de livraison programmée</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
          Vous n'avez pas encore passé de commande sur la plateforme.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
          <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
            <div className="min-w-[180px]">Réf Commande &amp; Statut</div>
            <div className="flex items-center gap-4">
              <div className="w-[110px]">Date Commande</div>
              <div className="w-[130px] text-emerald-800 font-extrabold flex items-center gap-1">
                <span>Date Livraison</span>
              </div>
              <div className="w-[130px]">Client / Acheteur</div>
              <div className="w-[60px]">Articles</div>
              <div className="w-[110px]">Règlement</div>
              <div className="w-[90px] text-right">Total TTC</div>
              <div className="w-[24px]"></div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const associatedSubs = subOrders.filter((s) => s.parentOrderId === order.id || s.orderId === order.id);
              const reqDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "Date en attente";
              const totals = computeOrderTotals(order);

              return (
                <React.Fragment key={order.id}>
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-3 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 sm:gap-0"
                  >
                    <div className="min-w-[180px] flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono">
                        #{order.orderNumber || order.id?.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {order.status === 'delivered' ? 'Livré' : order.status === 'paid' ? 'Payé' : 'En cours'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-[110px] text-slate-600 font-sans text-xs">
                        {order.createdAt?.toDate 
                          ? formatFrenchDate(order.createdAt.toDate().toISOString().split('T')[0], { day: "numeric", month: "numeric", year: "numeric" })
                          : String(order.createdAt || '-').split('T')[0]}
                      </div>

                      <div className="w-[130px] font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/80 flex items-center gap-1.5 text-[11px] font-mono shadow-xs">
                        <Calendar size={13} className="text-emerald-700 shrink-0" />
                        <span>
                          {reqDate !== "Date en attente"
                            ? (reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate)
                            : "À définir"}
                        </span>
                      </div>

                      <div className="w-[130px] font-bold text-slate-900 truncate" title={order.buyerName}>
                        {order.buyerName || 'Acheteur Pro'}
                      </div>

                      <div className="w-[60px] text-slate-700 font-bold">
                        {order.items?.length || 0} art.
                      </div>

                      <div className="w-[110px] text-slate-600 truncate text-[11px]">
                        {order.paymentMethod === 'mandat_public' ? 'Mandat Chorus' : 'Stripe B2B'}
                      </div>

                      <div className="w-[90px] text-right font-black text-slate-900 font-mono">
                        {totals.totalTTC.toFixed(2)} €
                      </div>

                      <div className="w-[24px] flex justify-end text-slate-400 hover:text-emerald-700 cursor-pointer">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/70 p-4 border-t border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <Calendar size={14} className="text-emerald-700" />
                          <span>Livraison programmée le : </span>
                          <strong className="text-emerald-900 font-mono">
                            {formatFrenchDate(reqDate)}
                          </strong>
                          <span className="text-[10px] font-semibold text-slate-500">
                            ({order.deliveryDetails?.deliveryWindow || "Créneau Matin"})
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handlePrintOrderSlip(e, order)}
                            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>Bon de Commande</span>
                          </button>

                          {order.status === "delivered" && (
                            <button
                              type="button"
                              onClick={(e) => handlePrintDeliverySlip(e, order)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer size={13} />
                              <span>Bon de Livraison (BL)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 💳 SYNTHÈSE FINANCIÈRE CONSOLIDÉE */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-2xs">
                        <span className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider block border-b border-slate-100 pb-1">
                          💳 Synthèse Financière Consolidée
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              Total Produits HT ({associatedSubs.length || 1} sous-commande{associatedSubs.length > 1 ? 's' : ''})
                            </span>
                            <strong className="font-mono text-slate-900">{totals.totalProductsHT.toFixed(2)} € HT</strong>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100">
                            <span className="text-[10px] text-emerald-800 font-bold block">Frais de Livraison B2B</span>
                            <strong className="font-mono text-emerald-900">
                              {totals.deliveryFeeHT > 0 ? `${totals.deliveryFeeHT.toFixed(2)} € HT` : "0.00 € (Offert)"}
                            </strong>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold block">TVA Alimentation (5.5%)</span>
                            <span className="font-mono text-slate-700">{totals.vatProducts.toFixed(2)} €</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-semibold block">TVA Transport (20%)</span>
                            <span className="font-mono text-slate-700">{totals.vatDelivery.toFixed(2)} €</span>
                          </div>
                          <div className="bg-slate-900 text-white p-2 rounded font-black text-right flex flex-col justify-center">
                            <span className="text-[9px] text-emerald-400 uppercase tracking-wider block">Total Général TTC</span>
                            <span className="font-mono text-sm text-amber-400">{totals.totalTTC.toFixed(2)} € TTC</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Truck size={13} className="text-emerald-700" /> Avancement par Maraîcher :
                        </span>
                        <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1 divide-y divide-slate-100">
                          {associatedSubs.length > 0 ? (
                            associatedSubs.map((sub) => {
                              const isSubReady = ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(sub.status);
                              return (
                                <div key={sub.id} className="pt-1 flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-800">{sub.producerName || "Maraîcher"}</span>
                                  {isSubReady ? (
                                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                                      <CheckCircle2 size={12} /> Prêt en cagette (Lot: {sub.lotNumber || "HACCP"})
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                                      <Clock size={12} /> En cours de récolte aux champs
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-slate-500 italic text-[11px]">En cours de traitement par les producteurs...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

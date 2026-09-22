import React, { useState, useEffect, useMemo } from "react";
import { Package, Calendar, Printer, Truck, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { OrderSlipGenerator } from "../../services/documents/OrderSlipGenerator";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";
import { formatFrenchDate } from "../../utils/deliveryCalendar";

import OrderTrackingFilters from "./components/OrderTrackingFilters";
import OrderTrackingPagination from "./components/OrderTrackingPagination";

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
 * 📅 Convertisseur robuste de date en timestamp (millisecondes) pour le tri
 */
function parseDateToTimestamp(dateVal) {
  if (!dateVal) return 0;
  if (typeof dateVal === "object" && typeof dateVal.toDate === "function") {
    return dateVal.toDate().getTime();
  }
  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }
  if (typeof dateVal === "string") {
    if (dateVal.includes("/")) {
      const parts = dateVal.split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
      }
    }
    if (dateVal.includes("-")) {
      const parts = dateVal.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return new Date(dateVal).getTime();
        } else {
          const [d, m, y] = parts;
          return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
        }
      }
    }
    const t = new Date(dateVal).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

/**
 * 🛒 COMPOSANT : OrderTracking.jsx
 * Emplacement : src/pages/SuiviDesCommandes/OrderTracking.jsx
 * 
 * Suivi des Commandes pour l'Acheteur Client :
 * - Grille réactive 8 colonnes adaptative même avec Sidebar ouverte
 * - Calcul exact du Total Général TTC (Produits HT + Livraison HT + TVA 5.5% + TVA 20%)
 * - Filtres multi-critères, Tri par date de livraison (millisecondes) et Pagination
 */
export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // ÉTATS DE FILTRAGE, TRI & PAGINATION
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Synchronisation Firestore en temps réel
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
      (err) => console.error("Erreur chargement commandes :", err)
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
        setError("Impossible de charger l'historique des commandes.");
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setDeliveryDateFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
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
    const html = OrderDocumentGenerator.generateDeliverySlipHTML ? OrderDocumentGenerator.generateDeliverySlipHTML(order) : "";
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // 1. FILTRAGE MULTI-CRITÈRES & RECHERCHE
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Recherche textuelle
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const numMatch = (order.orderNumber || order.id || "").toLowerCase().includes(term);
        const buyerMatch = (order.buyerName || "").toLowerCase().includes(term);
        const itemMatch = (order.items || []).some((item) =>
          (item.name || item.title || "").toLowerCase().includes(term)
        );
        if (!numMatch && !buyerMatch && !itemMatch) return false;
      }

      // Filtre Statut
      if (statusFilter !== "ALL") {
        if (statusFilter === "delivered" && order.status !== "delivered") return false;
        if (statusFilter === "paid" && !["paid", "preparing", "ready_for_pickup"].includes(order.status)) return false;
        if (statusFilter === "preparing" && order.status !== "preparing") return false;
      }

      // Filtre Mode de Règlement
      if (paymentFilter !== "ALL") {
        if (order.paymentMethod !== paymentFilter) return false;
      }

      // Filtre Date de Livraison
      if (deliveryDateFilter !== "") {
        const delivDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "";
        if (delivDate !== deliveryDateFilter) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, deliveryDateFilter]);

  // 2. TRI DYNAMIQUE (AVEC CONVERSION TEMPORELLE RIGOUREUSE)
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === "createdAt") {
        valA = parseDateToTimestamp(a.createdAt);
        valB = parseDateToTimestamp(b.createdAt);
      } else if (sortBy === "selectedDate") {
        const dateA = a.selectedDate || a.deliveryDate || a.deliveryDetails?.selectedDate || "";
        const dateB = b.selectedDate || b.deliveryDate || b.deliveryDetails?.selectedDate || "";
        valA = parseDateToTimestamp(dateA);
        valB = parseDateToTimestamp(dateB);
      } else if (sortBy === "totalTTC") {
        valA = computeOrderTotals(a).totalTTC;
        valB = computeOrderTotals(b).totalTTC;
      } else if (sortBy === "buyerName") {
        valA = (a.buyerName || "").toLowerCase();
        valB = (b.buyerName || "").toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortBy, sortOrder]);

  // 3. PAGINATION
  const totalFilteredCount = sortedOrders.length;
  const totalPages =
    itemsPerPage === "ALL" || itemsPerPage >= 999999
      ? 1
      : Math.ceil(totalFilteredCount / (Number(itemsPerPage) || 10));

  const paginatedOrders = useMemo(() => {
    if (itemsPerPage === "ALL" || itemsPerPage >= 999999) return sortedOrders;
    const size = Number(itemsPerPage) || 10;
    const start = (currentPage - 1) * size;
    return sortedOrders.slice(start, start + size);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const startIndex = totalFilteredCount === 0 ? 0 : (currentPage - 1) * (itemsPerPage === "ALL" || itemsPerPage >= 999999 ? totalFilteredCount : Number(itemsPerPage)) + 1;
  const endIndex = itemsPerPage === "ALL" || itemsPerPage >= 999999 ? totalFilteredCount : Math.min(currentPage * Number(itemsPerPage), totalFilteredCount);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs font-semibold text-emerald-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        <span>Chargement des commandes...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 space-y-4 text-xs font-sans text-slate-800 transition-all">
      {/* EN-TÊTE PRINCIPAL */}
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

      {/* BARRE DE FILTRES MULTI-CRITÈRES */}
      <OrderTrackingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        dateFilter={deliveryDateFilter}
        setDateFilter={setDeliveryDateFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
        onResetFilters={handleResetFilters}
        filteredCount={totalFilteredCount}
        totalItems={orders.length}
      />

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium">
          Aucune commande enregistrée.
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium space-y-2">
          <p>Aucune commande ne correspond à vos critères de recherche.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-emerald-800 font-extrabold underline hover:text-emerald-950 cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* TABLEAU RÉACTIF ET ADAPTATIF À LA SIDEBAR (OVERFLOW-X-AUTO + MIN-WIDTH) */}
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-x-auto w-full transition-all">
            <div className="min-w-[820px] divide-y divide-slate-200">
              {/* EN-TÊTE DU TABLEAU (8 COLONNES ALIGNÉES 1-À-1) */}
              <div className="hidden sm:flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
                <div className="w-[170px] shrink-0">Réf Commande &amp; Statut</div>
                <div className="flex items-center gap-3 font-bold flex-1 justify-between">
                  <div className="w-[95px] shrink-0">Date Commande</div>
                  <div className="w-[120px] shrink-0 text-emerald-800 font-extrabold flex items-center gap-1">
                    <span>Date Livraison</span>
                  </div>
                  <div className="w-[130px] shrink-0">Client / Acheteur</div>
                  <div className="w-[50px] shrink-0 text-center">Articles</div>
                  <div className="w-[95px] shrink-0">Règlement</div>
                  <div className="w-[90px] shrink-0 text-right">Total TTC</div>
                  <div className="w-[24px] shrink-0"></div>
                </div>
              </div>

              {/* LISTE DES COMMANDES PAGINÉES */}
              <div>
                {paginatedOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const associatedSubs = subOrders.filter((s) => s.parentOrderId === order.id || s.orderId === order.id);
                  const reqDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "Date en attente";
                  const totals = computeOrderTotals(order);

                  return (
                    <React.Fragment key={order.id}>
                      {/* LIGNE DE TABLEAU RÉACTIVE */}
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className="flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/90 transition-colors cursor-pointer text-xs font-sans border-b border-slate-100 last:border-b-0"
                      >
                        {/* Col 1 : Réf Commande & Statut (w-[170px] shrink-0) */}
                        <div className="w-[170px] shrink-0 flex items-center gap-2">
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

                        <div className="flex items-center gap-3 flex-1 justify-between">
                          {/* Col 2 : Date Commande (w-[95px] shrink-0) */}
                          <div className="w-[95px] shrink-0 text-slate-600 font-medium text-[11px]">
                            {order.createdAt?.toDate 
                              ? formatFrenchDate(order.createdAt.toDate().toISOString().split('T')[0], { day: "numeric", month: "numeric", year: "numeric" })
                              : (order.createdAt ? String(order.createdAt).split('T')[0] : "-")}
                          </div>

                          {/* Col 3 : Date Livraison Souhaitée - Badge Vert (w-[120px] shrink-0) */}
                          <div className="w-[120px] shrink-0 font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/90 flex items-center gap-1.5 text-[11px] font-mono shadow-2xs">
                            <Calendar size={13} className="text-emerald-700 shrink-0" />
                            <span>
                              {reqDate !== "Date en attente"
                                ? (reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate)
                                : "À définir"}
                            </span>
                          </div>

                          {/* Col 4 : Client / Acheteur (w-[130px] shrink-0) */}
                          <div className="w-[130px] shrink-0 font-bold text-slate-900 truncate text-[11px]" title={order.buyerName}>
                            {order.buyerName || 'Acheteur Pro'}
                          </div>

                          {/* Col 5 : Articles (w-[50px] shrink-0 text-center) */}
                          <div className="w-[50px] shrink-0 text-center text-slate-700 font-extrabold text-[11px]">
                            {order.items?.length || 0} art.
                          </div>

                          {/* Col 6 : Règlement (w-[95px] shrink-0) */}
                          <div className="w-[95px] shrink-0 text-slate-600 truncate text-[11px] font-medium">
                            {order.paymentMethod === 'mandat_public' ? 'Mandat Chorus' : order.paymentMethod === 'virement_b2b' ? 'Virement 30j' : 'Stripe B2B'}
                          </div>

                          {/* Col 7 : Total Général TTC Consolidé (w-[90px] shrink-0 text-right) */}
                          <div className="w-[90px] shrink-0 text-right font-black text-slate-900 font-mono text-[12px]">
                            {totals.totalTTC.toFixed(2)} €
                          </div>

                          {/* Col 8 : Chevron Expand (w-[24px] shrink-0 text-right) */}
                          <div className="w-[24px] shrink-0 text-right text-slate-400 hover:text-emerald-700">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* PANNEAU DÉPLIABLE ACCORDÉON */}
                      {isExpanded && (
                        <div className="bg-slate-50/80 p-4 border-t border-slate-200 space-y-3 text-xs animate-fade-in">
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
          </div>

          {/* BARRE DE PAGINATION */}
          <OrderTrackingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalFilteredCount}
            startIndex={startIndex}
            endIndex={endIndex}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}

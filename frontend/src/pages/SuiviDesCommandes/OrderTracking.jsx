import React, { useState, useEffect, useMemo } from "react";
import { Package, Calendar, Printer, Truck, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// ✅ Remontée de 2 niveaux si le fichier est dans src/pages/SuiviDesCommandes/
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";
import { formatFrenchDate } from "../../utils/deliveryCalendar.js";

import OrderTrackingFilters from "./components/OrderTrackingFilters";
import OrderTrackingPagination from "./components/OrderTrackingPagination";

/**
 * 🛒 COMPOSANT : OrderTracking.jsx
 * Emplacement : src/pages/SuiviDesCommandes/OrderTracking.jsx (ou src/pages/SuiviDesCommandes/components/OrderTracking.jsx)
 */
export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // État local des filtres et de la pagination (Initialisés avec des chaînes vides et jamais undefined)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
    const html = OrderDocumentGenerator.generateOrderSlipHTML(order);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handlePrintDeliverySlip = (e, order) => {
    e.stopPropagation();
    const html = OrderDocumentGenerator.generateDeliverySlipHTML(order);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const numMatch = (order.orderNumber || order.id || "").toLowerCase().includes(term);
        const buyerMatch = (order.buyerName || "").toLowerCase().includes(term);
        const itemMatch = (order.items || []).some((item) =>
          (item.name || item.title || "").toLowerCase().includes(term)
        );
        if (!numMatch && !buyerMatch && !itemMatch) return false;
      }

      if (statusFilter !== "ALL") {
        if (statusFilter === "delivered" && order.status !== "delivered") return false;
        if (statusFilter === "paid" && !["paid", "preparing", "ready_for_pickup"].includes(order.status)) return false;
        if (statusFilter === "preparing" && order.status !== "preparing") return false;
      }

      if (paymentFilter !== "ALL" && order.paymentMethod !== paymentFilter) return false;

      if (deliveryDateFilter !== "") {
        const delivDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "";
        if (delivDate !== deliveryDateFilter) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, deliveryDateFilter]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA, valB;
      if (sortBy === "createdAt") {
        valA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        valB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      } else if (sortBy === "selectedDate") {
        valA = a.selectedDate || a.deliveryDate || "";
        valB = b.selectedDate || b.deliveryDate || "";
      } else if (sortBy === "totalTTC") {
        valA = Number(a.totalTTC || a.totalAmount || a.amount || 0);
        valB = Number(b.totalTTC || b.totalAmount || b.amount || 0);
      } else if (sortBy === "buyerName") {
        valA = (a.buyerName || "").toLowerCase();
        valB = (b.buyerName || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortBy, sortOrder]);

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
    <div className="max-w-6xl mx-auto p-4 space-y-4 text-xs font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-700" size={22} /> Suivi des Commandes Acheteur
          </h1>
          <p className="text-xs text-slate-500">
            Consultez le statut, filtrez et suivez les <strong className="text-slate-900">dates de livraison programmées</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Barre de Filtres Multi-critères */}
      <OrderTrackingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        deliveryDateFilter={deliveryDateFilter}
        setDeliveryDateFilter={setDeliveryDateFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
        onResetFilters={handleResetFilters}
        totalFilteredCount={totalFilteredCount}
        totalCount={orders.length}
      />

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
          Aucune commande enregistrée.
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium space-y-2">
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
          <div className="border border-slate-200 rounded-md bg-white shadow-sm overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
                <div className="w-[150px] shrink-0">Réf Commande &amp; Statut</div>
                <div className="flex items-center gap-2.5 font-bold">
                  <div className="w-[95px] shrink-0">Date Commande</div>
                  <div className="w-[115px] shrink-0 text-emerald-800 font-extrabold flex items-center gap-1">
                    <span>Date Livraison</span>
                  </div>
                  <div className="w-[110px] shrink-0">Client / Acheteur</div>
                  <div className="w-[50px] shrink-0 text-center">Articles</div>
                  <div className="w-[95px] shrink-0">Règlement</div>
                  <div className="w-[80px] shrink-0 text-right">Total TTC</div>
                  <div className="w-[20px] shrink-0"></div>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {paginatedOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const associatedSubs = subOrders.filter((s) => s.parentOrderId === order.id || s.orderId === order.id);
                  const rawDeliveryDate = order.selectedDate || order.deliveryDate || order.deliveryDetails?.selectedDate || "";
                  const formattedDeliveryDate = rawDeliveryDate ? formatFrenchDate(rawDeliveryDate) : "Non spécifiée";

                  return (
                    <React.Fragment key={order.id}>
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer text-xs"
                      >
                        <div className="w-[150px] shrink-0 flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 font-mono text-[11px]">
                            #{order.orderNumber || order.id?.substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            order.status === "delivered" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            order.status === "paid" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {order.status === "delivered" ? "Livré" : order.status === "paid" ? "Payé" : "En cours"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 font-medium">
                          <div className="w-[95px] shrink-0 text-slate-600 font-sans text-[11px]">
                            {order.createdAt?.toDate 
                              ? order.createdAt.toDate().toLocaleDateString("fr-FR")
                              : String(order.createdAt || "-").split("T")}
                          </div>

                          <div className="w-[115px] shrink-0 font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center gap-1 text-[10px] font-mono shadow-xs">
                            <Calendar size={12} className="text-emerald-700 shrink-0" />
                            <span>
                              {rawDeliveryDate ? rawDeliveryDate.split("-").reverse().join("/") : "Non spécifiée"}
                            </span>
                          </div>

                          <div className="w-[110px] shrink-0 font-bold text-slate-900 truncate text-[11px]" title={order.buyerName}>
                            {order.buyerName || "Acheteur Pro"}
                          </div>

                          <div className="w-[50px] shrink-0 text-center text-slate-700 font-bold text-[11px]">
                            {order.items?.length || 0} art.
                          </div>

                          <div className="w-[95px] shrink-0 text-slate-600 truncate text-[10px]">
                            {order.paymentMethod === "mandat_public" ? "Mandat Chorus" : "Stripe B2B"}
                          </div>

                          <div className="w-[80px] shrink-0 text-right font-black text-slate-900 font-mono text-[11px]">
                            {Number(order.totalTTC || order.amountTTC || order.totalAmount || 0).toFixed(2)} €
                          </div>

                          <div className="w-[20px] shrink-0 flex justify-end text-slate-400 hover:text-emerald-700">
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-slate-50/70 p-4 border-t border-slate-200 space-y-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              <Calendar size={14} className="text-emerald-700" />
                              <span>Livraison programmée le : </span>
                              <strong className="text-emerald-900 font-mono capitalize">
                                {formattedDeliveryDate}
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

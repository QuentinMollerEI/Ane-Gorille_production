import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Truck, Package, RefreshCw, ShoppingBag, DollarSign } from "lucide-react";

import TrackingFilters from "./components/TrackingFilters";
import OrderTrackingCard from "./components/OrderTrackingCard";

/**
 * 🌾 COMPOSANT CENTRAL : OrderTracking.jsx
 * Interface métier moderne, épurée et espacée pour le suivi des commandes.
 */
export default function OrderTracking() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // États des filtres, tri et pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const role = user?.role;
    const isSupplier = role === "producer" || role === "producteur" || role === "fournisseur";
    const isCarrier = role === "carrier" || role === "livreur";

    let qOrders;
    if (isSupplier) {
      qOrders = query(collection(db, "orders"), where("producerIds", "array-contains", user.uid));
    } else if (isCarrier) {
      qOrders = query(collection(db, "orders"));
    } else {
      qOrders = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    }

    const unsubOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const loadedOrders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setOrders(loadedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de synchronisation des commandes :", error);
        setLoading(false);
      }
    );

    // Écoute des sous-commandes
    let qSubs = isSupplier
      ? query(collection(db, "sub_orders"), where("producerId", "==", user.uid))
      : query(collection(db, "sub_orders"), where("buyerId", "==", user.uid));

    const unsubSubs = onSnapshot(
      qSubs,
      (snapshot) => {
        const loadedSubs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubOrders(loadedSubs);
      },
      (err) => console.error("Erreur sub_orders:", err)
    );

    return () => {
      unsubOrders();
      unsubSubs();
    };
  }, [user?.uid, user?.role]);

  // Fusion stricte et sans doublons des sous-commandes appartenant à chaque commande
  const mergedOrders = useMemo(() => {
    return orders.map((ord) => {
      // Filtrage STRICT par orderId ou parentOrderId (Pas de filtre élargi par buyerId qui crée des doublons)
      const matchingSubs = subOrders.filter((s) => s.orderId === ord.id || s.parentOrderId === ord.id);
      
      let effectiveStatus = ord.status || "paid";
      if (matchingSubs.length > 0) {
        const allReady = matchingSubs.every((s) => 
          s.status === "A_RAMASSER" || s.status === "PRET_A_EXPEDIER" || s.status === "EXPEDIE" || s.status === "DELIVERED"
        );
        const anyHarvesting = matchingSubs.some((s) => s.status === "EN_PREPARATION" || s.status === "A_PREPARER" || s.status === "HARVESTING");
        
        if (allReady && (effectiveStatus === "paid" || effectiveStatus === "A_PREPARER")) {
          effectiveStatus = "ready_for_pickup";
        } else if (anyHarvesting && effectiveStatus === "paid") {
          effectiveStatus = "preparing";
        }
      }

      return {
        ...ord,
        status: effectiveStatus,
        subOrders: matchingSubs.length > 0 ? matchingSubs : ord.subOrders || [],
      };
    });
  }, [orders, subOrders]);

  // Filtrage et Tri
  const filteredAndSortedOrders = useMemo(() => {
    let result = mergedOrders.filter((ord) => {
      const qStr = searchTerm.toLowerCase();
      const matchSearch =
        (ord.orderNumber || "").toLowerCase().includes(qStr) ||
        (ord.buyerName || "").toLowerCase().includes(qStr) ||
        (ord.id || "").toLowerCase().includes(qStr);

      const normStatus = String(ord.status || "").toLowerCase();
      let matchStatus = true;
      if (selectedStatus === "paid") matchStatus = ["paid", "pending", "a_preparer"].includes(normStatus);
      else if (selectedStatus === "preparing") matchStatus = ["preparing", "harvesting", "en_preparation"].includes(normStatus);
      else if (selectedStatus === "ready_for_pickup") matchStatus = ["ready_for_pickup", "ready_to_ship", "a_ramasser", "pret_a_expedier"].includes(normStatus);
      else if (selectedStatus === "in_transit") matchStatus = ["in_transit", "shipping", "en_cours_de_livraison", "expedie"].includes(normStatus);
      else if (selectedStatus === "delivered") matchStatus = ["delivered", "livre", "termine"].includes(normStatus);

      let matchDate = true;
      if (dateFilter !== "all" && ord.createdAt) {
        const orderDate = new Date(ord.createdAt?.seconds ? ord.createdAt.seconds * 1000 : ord.createdAt);
        const now = new Date();
        if (dateFilter === "today") matchDate = orderDate.toDateString() === now.toDateString();
        else if (dateFilter === "7days") matchDate = now - orderDate <= 7 * 24 * 60 * 60 * 1000;
        else if (dateFilter === "30days") matchDate = now - orderDate <= 30 * 24 * 60 * 60 * 1000;
      }

      return matchSearch && matchStatus && matchDate;
    });

    // Tri
    result.sort((a, b) => {
      const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
      const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
      const valA = Number(a.totalTTC ?? a.amountTTC ?? 0);
      const valB = Number(b.totalTTC ?? b.amountTTC ?? 0);

      if (sortBy === "date_asc") return tA - tB;
      if (sortBy === "amount_desc") return valB - valA;
      if (sortBy === "amount_asc") return valA - valB;
      return tB - tA;
    });

    return result;
  }, [mergedOrders, searchTerm, selectedStatus, dateFilter, sortBy]);

  // Pagination
  const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredAndSortedOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    if (pageSize === "all") return filteredAndSortedOrders;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedOrders.slice(start, start + pageSize);
  }, [filteredAndSortedOrders, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setDateFilter("all");
    setSortBy("date_desc");
    setCurrentPage(1);
  };

  const activeCount = mergedOrders.filter((o) => ["paid", "preparing", "ready_for_pickup", "in_transit", "a_preparer", "en_preparation", "a_ramasser"].includes(String(o.status).toLowerCase())).length;
  const deliveredCount = mergedOrders.filter((o) => ["delivered", "livre", "termine"].includes(String(o.status).toLowerCase())).length;
  
  // Calcul précis du volume total TTC avec prise en compte du sous-total et frais de port
  const totalVolumeTTC = mergedOrders.reduce((acc, o) => {
    const rawTTC = Number(o.totalTTC ?? o.amountTTC ?? 0);
    if (rawTTC > 0) return acc + rawTTC;

    const itemsHT = (o.items || []).reduce((s, i) => s + Number(i.priceHT ?? i.price ?? 0) * Number(i.quantity ?? i.qty ?? 1), 0);
    const rawHT = Number(o.totalHT ?? o.amountHT ?? 0);
    const totHT = rawHT > 0 ? rawHT : itemsHT;
    let fee = Number(o.deliveryFee ?? 0);
    if (fee === 0 && totHT < 300 && totHT > 0) fee = totHT >= 150 ? 8 : 15;
    const vat = totHT * 0.055 + (fee > 0 ? fee * 0.20 : 0);
    return acc + totHT + fee + vat;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-xs font-sans text-slate-800">
      {/* 📊 KPI HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Commandes Actives</span>
            <span className="text-xl font-bold font-mono text-amber-900">{activeCount}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded border border-amber-200">
            <Truck size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Commandes Livrées</span>
            <span className="text-xl font-bold font-mono text-emerald-900">{deliveredCount}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Volume Total Engagé</span>
            <span className="text-xl font-bold font-mono text-slate-900">{totalVolumeTTC.toFixed(2)} €</span>
          </div>
          <div className="p-2 bg-slate-100 text-slate-700 rounded border border-slate-200">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* 🔍 BARRE DE FILTRES ET PAGINATION */}
      <TrackingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onResetFilters={handleResetFilters}
        totalCount={mergedOrders.length}
        filteredCount={filteredAndSortedOrders.length}
      />

      {/* 📋 EN-TÊTE DE TABLEAU DE BORD */}
      <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-t-md font-bold text-[11px] text-slate-600 uppercase tracking-wider">
        <div className="min-w-[200px]">Réf Commande & Statut</div>
        <div className="flex items-center gap-4">
          <div className="w-[120px]">Date</div>
          <div className="w-[140px]">Client / Acheteur</div>
          <div className="w-[60px]">Articles</div>
          <div className="w-[110px]">Règlement</div>
          <div className="w-[90px] text-right">Total TTC</div>
          <div className="w-[24px]"></div>
        </div>
      </div>

      {/* LISTE OU SPINNER */}
      {loading ? (
        <div className="flex justify-center items-center py-16 bg-white border border-slate-200 rounded-md">
          <RefreshCw className="animate-spin text-emerald-700" size={24} />
        </div>
      ) : paginatedOrders.length > 0 ? (
        <div className="space-y-1.5">
          {paginatedOrders.map((ord) => (
            <OrderTrackingCard
              key={ord.id}
              order={ord}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-md text-slate-400 space-y-2">
          <ShoppingBag size={32} className="mx-auto text-slate-300" />
          <p className="font-semibold text-slate-700 text-xs">Aucune commande ne correspond aux filtres.</p>
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-xs cursor-pointer"
          >
            Réinitialiser les critères
          </button>
        </div>
      )}
    </div>
  );
}

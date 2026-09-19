import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Truck, Package, RefreshCw, ShoppingBag, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";

import TrackingFilters from "./components/TrackingFilters";
import OrderTrackingCard from "./components/OrderTrackingCard";

/**
 * 🌾 COMPOSANT CENTRAL : OrderTracking.jsx
 * Page principale de Suivi des Commandes avec pagination stricte (10 / 20 / 50 / Tout).
 */
export default function OrderTracking() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // State Pagination
  const [pageSize, setPageSize] = useState(10); // 10, 20, 50, -1 (Tout)
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const role = user?.role;
    const isSupplier = role === "producer" || role === "producteur" || role === "fournisseur";
    const isCarrier = role === "carrier" || role === "livreur";

    let q;
    if (isSupplier) {
      q = query(collection(db, "orders"), where("producerIds", "array-contains", user.uid));
    } else if (isCarrier) {
      q = query(collection(db, "orders"));
    } else {
      q = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedOrders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        loadedOrders.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        setOrders(loadedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de synchronisation des commandes :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.role]);

  // Réinitialiser la page à 1 dès que les filtres ou la recherche changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, dateFilter, pageSize]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchSearch =
        (ord.orderNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.id || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === "all" || ord.status === selectedStatus;

      let matchDate = true;
      if (dateFilter !== "all" && ord.createdAt) {
        const orderDate = new Date(ord.createdAt?.seconds ? ord.createdAt.seconds * 1000 : ord.createdAt);
        const now = new Date();
        if (dateFilter === "today") {
          matchDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === "7days") {
          matchDate = now - orderDate <= 7 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === "30days") {
          matchDate = now - orderDate <= 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchTerm, selectedStatus, dateFilter]);

  // Moteur de pagination numérique strict
  const totalFilteredCount = filteredOrders.length;
  const numericPageSize = Number(pageSize);

  const totalPages = useMemo(() => {
    if (numericPageSize === -1 || totalFilteredCount === 0) return 1;
    return Math.max(1, Math.ceil(totalFilteredCount / numericPageSize));
  }, [totalFilteredCount, numericPageSize]);

  const paginatedOrders = useMemo(() => {
    if (numericPageSize === -1) return filteredOrders;
    const validPage = Math.max(1, Math.min(currentPage, totalPages));
    const startIndex = (validPage - 1) * numericPageSize;
    const endIndex = startIndex + numericPageSize;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, numericPageSize, totalPages]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Confirmez-vous avoir bien reçu votre livraison ?")) return;

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "delivered",
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Erreur de confirmation de livraison :", err);
      alert("Erreur lors de la confirmation.");
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const activeCount = orders.filter((o) => ["paid", "preparing", "ready_for_pickup", "in_transit"].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const totalVolumeTTC = orders.reduce((acc, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const calc = items.reduce((a, i) => a + Number(i.priceHT ?? i.price ?? 0) * Number(i.quantity ?? i.qty ?? 1) * 1.055, 0);
    return acc + Number(o.totalTTC ?? o.amountTTC ?? o.totalAmount ?? o.amount ?? (calc > 0 ? calc : 0));
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 animate-fade-in text-xs">
      {/* CARTES DE SYNTHÈSE HAUT DE PAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Commandes en Cours</span>
            <span className="text-xl font-black text-amber-900 font-mono">{activeCount}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
            <Truck size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Commandes Livrées</span>
            <span className="text-xl font-black text-emerald-900 font-mono">{deliveredCount}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Volume Total Commandé</span>
            <span className="text-xl font-black text-gray-900 font-mono">{totalVolumeTTC.toFixed(2)} € TTC</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* BARRE DE FILTRES ET RECHERCHE */}
      <TrackingFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onResetFilters={handleResetFilters}
        totalCount={orders.length}
        filteredCount={totalFilteredCount}
      />

      {/* LISTE DES COMMANDES AVEC PAGINATION STRICTE */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <RefreshCw className="animate-spin text-emerald-700" size={28} />
        </div>
      ) : paginatedOrders.length > 0 ? (
        <div className="space-y-3">
          {paginatedOrders.map((ord) => (
            <OrderTrackingCard
              key={ord.id}
              order={ord}
              onConfirmDelivery={handleConfirmDelivery}
            />
          ))}

          {/* BARRE DE PAGINATION INTUITIVE */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-2xs mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500">Afficher par page :</span>
              {[10, 20, 50, -1].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handlePageSizeChange(size)}
                  className={`px-2.5 py-1 rounded-md text-xs font-black transition-colors cursor-pointer ${
                    Number(pageSize) === Number(size)
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {size === -1 ? "Tout" : size}
                </button>
              ))}
            </div>

            {numericPageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Page précédente"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-extrabold text-gray-700 font-mono">
                  Page {currentPage} sur {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Page suivante"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 space-y-2">
          <ShoppingBag size={36} className="mx-auto text-gray-300" />
          <p className="font-extrabold text-sm text-gray-600">Aucune commande ne correspond à vos critères.</p>
          <p className="text-xs text-gray-400">
            Ajustez vos filtres ou passez une commande depuis la boutique.
          </p>
        </div>
      )}
    </div>
  );
}
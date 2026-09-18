import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Truck, Package, RefreshCw, ShoppingBag, DollarSign } from "lucide-react";

import TrackingFilters from "./components/TrackingFilters";
import OrderTrackingCard from "./components/OrderTrackingCard";

/**
 * 🌾 COMPOSANT CENTRAL : OrderTracking.jsx
 * Page principale de Suivi des Commandes en temps réel.
 * S'adapte au rôle connecté (Acheteur, Producteur, Livreur, Admin).
 */
export default function OrderTracking() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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
          const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
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
  };

  const activeCount = orders.filter((o) => ["paid", "preparing", "ready_for_pickup", "in_transit"].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const totalVolumeTTC = orders.reduce((acc, o) => acc + Number(o.totalTTC ?? o.amountTTC ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in text-xs">
      {/* CARTES DE SYNTHÈSE HAUT DE PAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Commandes en Cours</span>
            <span className="text-xl font-black text-amber-900">{activeCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Truck size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Commandes Livrées</span>
            <span className="text-xl font-black text-emerald-900">{deliveredCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Volume Total Commandé</span>
            <span className="text-xl font-black text-gray-900">{totalVolumeTTC.toFixed(2)} € TTC</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
            <DollarSign size={20} />
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
        filteredCount={filteredOrders.length}
      />

      {/* LISTE DES COMMANDES OU SPINNER */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <RefreshCw className="animate-spin text-emerald-700" size={28} />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <OrderTrackingCard
              key={ord.id}
              order={ord}
              onConfirmDelivery={handleConfirmDelivery}
            />
          ))}
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

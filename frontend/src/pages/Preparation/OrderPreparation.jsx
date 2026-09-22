import React, { useState, useEffect, useMemo } from "react";
import { ListTodo, AlertCircle } from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";

import ToHarvestCompartment from "./components/ToHarvestCompartment";
import PreparationSlipModal from "./components/PreparationSlipModal";
import OrderTrackingFilters from "../SuiviDesCommandes/components/OrderTrackingFilters";
import OrderTrackingPagination from "../SuiviDesCommandes/components/OrderTrackingPagination";

export default function OrderPreparation() {
  const { user, userProfile } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [parentOrdersMap, setParentOrdersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État Modal Fiche de Préparation
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);

  // ÉTATS DES FILTRES & PAGINATION
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const role = userProfile?.role || user?.role || "producteur";

  // Synchronisation Firestore en temps réel
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const isProducer = role === "producteur" || role === "producer";
    const subOrdersRef = collection(db, "sub_orders");
    const qSubs = isProducer 
      ? query(subOrdersRef, where("producerId", "==", user.uid))
      : subOrdersRef;

    const unsubSubs = onSnapshot(
      qSubs,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement ordres de préparation :", err);
        setError("Impossible de charger les ordres de préparation.");
        setLoading(false);
      }
    );

    const unsubParents = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        const map = {};
        snap.docs.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data();
        });
        setParentOrdersMap(map);
      },
      (err) => console.error("Erreur chargement commandes parentes :", err)
    );

    return () => {
      unsubSubs();
      unsubParents();
    };
  }, [user?.uid, role]);

  const enrichedSubOrders = useMemo(() => {
    return subOrders.map((sub) => {
      const parent = parentOrdersMap[sub.parentOrderId || sub.orderId] || {};
      return {
        ...sub,
        buyerName: sub.buyerName || parent.buyerName || "Acheteur Client",
        buyerCompany: parent.buyerCompany || parent.companyName || sub.buyerName || "Client Pro",
        deliveryAddress: sub.deliveryAddress || parent.deliveryAddress || "Adresse de livraison",
        selectedDate: sub.selectedDate || parent.selectedDate || parent.deliveryDate || parent.deliveryDetails?.selectedDate || "",
        parentStatus: parent.status || "VALIDÉE",
        parentCreatedAt: parent.createdAt
      };
    });
  }, [subOrders, parentOrdersMap]);

  const filteredOrders = enrichedSubOrders.filter((ord) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (ord.id || "").toLowerCase().includes(searchLower) ||
      (ord.parentOrderId || "").toLowerCase().includes(searchLower) ||
      (ord.buyerName || "").toLowerCase().includes(searchLower) ||
      (ord.buyerCompany || "").toLowerCase().includes(searchLower) ||
      (ord.lotNumber || "").toLowerCase().includes(searchLower) ||
      (ord.items || []).some((item) =>
        (item.name || item.title || "").toLowerCase().includes(searchLower)
      );

    let matchesStatus = true;
    if (statusFilter !== "ALL") {
      matchesStatus = ord.status === statusFilter;
    }

    const reqDate = ord.selectedDate || "";
    const matchesDate = !dateFilter || reqDate === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let valA, valB;
    if (sortBy === "createdAt") {
      valA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      valB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    } else if (sortBy === "selectedDate") {
      valA = a.selectedDate || "";
      valB = b.selectedDate || "";
    } else if (sortBy === "buyerName") {
      valA = (a.buyerName || "").toLowerCase();
      valB = (b.buyerName || "").toLowerCase();
    } else {
      valA = a[sortBy] || "";
      valB = b[sortBy] || "";
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedOrders.length / (itemsPerPage >= 999999 ? 1 : itemsPerPage)) || 1;
  const paginatedOrders = itemsPerPage >= 999999 
    ? sortedOrders 
    : sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleOpenPreparationModal = (subOrder) => {
    setSelectedOrderForModal(subOrder);
  };

  const handleMarkAsReadyToShip = async (subOrderId, lotNumber, crateCount, updatedItems = null, notes = "") => {
    try {
      const subRef = doc(db, "sub_orders", subOrderId);
      const generatedLot = lotNumber || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
      
      const subToUpdate = subOrders.find(s => s.id === subOrderId) || {};
      const parentOrderId = subToUpdate.parentOrderId || subToUpdate.orderId;

      await updateDoc(subRef, {
        status: "A_RAMASSER",
        lotNumber: generatedLot,
        crateCount: Number(crateCount) || 1,
        ...(updatedItems ? { items: updatedItems } : {}),
        preparationNotes: notes || "",
        preparedAt: new Date(),
        readyForPickup: true
      });

      if (parentOrderId) {
        const parentRef = doc(db, "orders", parentOrderId);
        const qSubs = query(collection(db, "sub_orders"), where("parentOrderId", "==", parentOrderId));
        const snap = await getDocs(qSubs);
        const allSubs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allReady = allSubs.every(s => 
          s.id === subOrderId ? true : ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED", "ready_for_pickup"].includes(s.status)
        );

        if (allReady) {
          await updateDoc(parentRef, {
            status: "ready_for_pickup",
            subOrdersStatus: "A_RAMASSER",
            updatedAt: new Date()
          });
        } else {
          await updateDoc(parentRef, {
            status: "preparing",
            updatedAt: new Date()
          });
        }
      }

    } catch (err) {
      console.error("Erreur validation préparation :", err);
      alert("Erreur lors de la validation de la préparation.");
    }
  };

  const handlePrintPreparationSlip = (subOrder) => {
    const parent = parentOrdersMap[subOrder.parentOrderId || subOrder.orderId] || null;
    const html = OrderDocumentGenerator.generatePreparationSlipHTML(subOrder, parent);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-xs font-semibold text-emerald-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        <span>Chargement des ordres de récolte &amp; préparation...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 space-y-5 text-xs font-sans text-slate-800 transition-all animate-fade-in">
      
      {/* EN-TÊTE HARMONISÉ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ListTodo className="text-emerald-700" size={22} /> Ordres de Préparation &amp; Cueillette
          </h1>
          <p className="text-xs text-slate-500">
            Gestion des bacs, étiquetage sanitaire HACCP et synchronisation directe avec la flotte de livraison <strong className="text-slate-900">Âne &amp; Gorille</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* BARRE DE FILTRES IDENTIQUE AU SUIVI DES COMMANDES */}
      <OrderTrackingFilters
        searchTerm={searchTerm}
        setSearchTerm={(val) => { setSearchTerm(val); setCurrentPage(1); }}
        statusFilter={statusFilter}
        setStatusFilter={(val) => { setStatusFilter(val); setCurrentPage(1); }}
        paymentFilter="ALL"
        setPaymentFilter={() => {}}
        dateFilter={dateFilter}
        setDateFilter={(val) => { setDateFilter(val); setCurrentPage(1); }}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        totalItems={enrichedSubOrders.length}
        filteredCount={sortedOrders.length}
        onResetFilters={handleResetFilters}
      />

      {/* TABLEAU DES COMMANDES À RÉCOLTER ET EN PRÉPARATION */}
      <ToHarvestCompartment
        orders={paginatedOrders}
        onMarkAsReady={handleMarkAsReadyToShip}
        onOpenModal={handleOpenPreparationModal}
        onPrintSlip={handlePrintPreparationSlip}
      />

      {/* PAGINATION REUTILISABLE */}
      <OrderTrackingPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedOrders.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* MODAL BON DE PRÉPARATION INTERACTIF */}
      {selectedOrderForModal && (
        <PreparationSlipModal
          order={selectedOrderForModal}
          parentOrder={parentOrdersMap[selectedOrderForModal.parentOrderId || selectedOrderForModal.orderId]}
          onClose={() => setSelectedOrderForModal(null)}
          onValidateSuccess={handleMarkAsReadyToShip}
        />
      )}

    </div>
  );
}
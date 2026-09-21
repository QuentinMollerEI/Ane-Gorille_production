import React, { useState, useEffect, useMemo } from "react";
import { Truck, Package, ShieldCheck, AlertCircle, Map, Calendar, Calculator, CheckCircle2, Clock, Layers } from "lucide-react";
import { collection, query, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";
import { formatFrenchDate, formatDateToYYYYMMDD, getCalculatedDeliveryDate } from "../../utils/deliveryCalendar.js";

import RouteFilters from "./components/RouteFilters";
import RouteSummary from "./components/RouteSummary";
import PickupLeg from "./components/PickupLeg";
import DeliveryLeg from "./components/DeliveryLeg";
import RouteCalculatorModal from "./components/RouteCalculatorModal";

/**
 * 🚚 Helper : Extraction exacte de la Date de Livraison Souhaitée
 */
const getDeliveryRequestedDate = (subOrder) => {
  if (!subOrder) return getCalculatedDeliveryDate(new Date());
  const dt = subOrder.selectedDate || 
             subOrder.deliveryDate || 
             subOrder.deliveryDetails?.selectedDate || 
             subOrder.targetDeliveryDate;

  if (dt) {
    if (typeof dt.toDate === "function") {
      try { return formatDateToYYYYMMDD(dt.toDate()); } catch (e) {}
    }
    if (dt.seconds !== undefined && dt.seconds !== null) {
      try { return formatDateToYYYYMMDD(new Date(dt.seconds * 1000)); } catch (e) {}
    }
    const str = String(dt).split("T")[0];
    if (str && str !== "Non spécifiée" && str !== "undefined") return str;
  }

  const createdAt = subOrder.createdAt;
  if (createdAt) {
    if (typeof createdAt.toDate === "function") {
      try { return getCalculatedDeliveryDate(createdAt.toDate()); } catch (e) {}
    }
    if (createdAt.seconds !== undefined && createdAt.seconds !== null) {
      try { return getCalculatedDeliveryDate(new Date(createdAt.seconds * 1000)); } catch (e) {}
    }
  }
  return getCalculatedDeliveryDate(new Date());
};

export default function RoutePlanner() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState("pickups"); // 'pickups' | 'deliveries'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  
  // Date sélectionnée par le livreur (Par défaut : Première date disponible)
  const [selectedDate, setSelectedDate] = useState(getCalculatedDeliveryDate(new Date()));
  const [processingId, setProcessingId] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Synchronisation Firestore en temps réel
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(collection(db, "sub_orders"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation logistique :", err);
        setError("Impossible d'accéder aux données logistiques en temps réel.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // Action 1 : Confirmation du chargement chez un maraîcher -> Passage au statut EN TRANSIT (EXPEDIE)
  const handleConfirmPickup = async (producerId, associatedSubs) => {
    setProcessingId(producerId);
    try {
      const batch = writeBatch(db);
      associatedSubs.forEach((sub) => {
        const docRef = doc(db, "sub_orders", sub.id);
        batch.update(docRef, {
          status: "EXPEDIE",
          pickedUpAt: new Date(),
          carrierId: user.uid,
          carrierName: user.displayName || "Livreur Âne & Gorille",
        });
        if (sub.parentOrderId) {
          const parentRef = doc(db, "orders", sub.parentOrderId);
          batch.update(parentRef, {
            status: "EN_COURS_DE_LIVRAISON",
            carrierId: user.uid,
            carrierName: user.displayName || "Livreur Âne & Gorille",
          });
        }
      });
      await batch.commit();
      alert("Enlèvement confirmé ! Les colis maraîchers sont chargés dans le véhicule et sont EN TRANSIT.");
    } catch (err) {
      console.error("Erreur lors de la validation du chargement :", err);
      alert("Une erreur technique est survenue lors du chargement.");
    } finally {
      setProcessingId(null);
    }
  };

  // Action 2 : Confirmation de livraison client avec température HACCP, signature eIDAS et réserves
  const handleConfirmDelivery = async (parentOrderId, tempHaccp, signature, recipientName, reservations) => {
    setProcessingId(parentOrderId);
    try {
      await CheckoutOrchestrator.validateDelivery(
        parentOrderId,
        tempHaccp,
        signature || "EMARGEMENT_NUMERIQUE_OK",
        recipientName || ""
      );
      alert("Livraison validée avec succès ! Le Bon de Livraison (BL) émargé a été émis.");
    } catch (err) {
      console.error("Erreur lors de la validation de la livraison :", err);
      alert("Erreur de livraison : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const sectors = useMemo(() => [
    ...new Set(
      subOrders
        .map((sub) => (sub.deliveryAddress ? sub.deliveryAddress.split(",").pop()?.trim() : null))
        .filter(Boolean)
    ),
  ], [subOrders]);

  // 1. FILTRAGE STRICT PAR LA DATE DE LIVRAISON SOUHAITÉE CHOISIE À LA COMMANDE
  const filteredSubOrders = useMemo(() => {
    return subOrders.filter((sub) => {
      if (selectedDate && selectedDate !== "ALL") {
        const targetDate = getDeliveryRequestedDate(sub);
        if (targetDate && targetDate !== selectedDate) return false;
      }
      if (selectedSector !== "ALL") {
        const subSector = sub.deliveryAddress ? sub.deliveryAddress.split(",").pop()?.trim() : "";
        if (subSector !== selectedSector) return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchProducer = (sub.producerName || "").toLowerCase().includes(q);
        const matchBuyer = (sub.buyerName || "").toLowerCase().includes(q);
        const matchAddress = (sub.deliveryAddress || "").toLowerCase().includes(q);
        const matchId = sub.id.toLowerCase().includes(q) || (sub.parentOrderId && sub.parentOrderId.toLowerCase().includes(q));
        return matchProducer || matchBuyer || matchAddress || matchId;
      }
      return true;
    });
  }, [subOrders, selectedDate, selectedSector, searchQuery]);

  // 2. CONSOLIDATION MULTI-FOURNISSEURS PAR COMMANDE POUR LA DATE SÉLECTIONNÉE
  const ordersConsolidationMap = useMemo(() => {
    const map = {};
    filteredSubOrders.forEach((sub) => {
      const parentId = sub.parentOrderId || "SANS_PARENT";
      if (!map[parentId]) {
        map[parentId] = {
          parentOrderId: parentId,
          buyerName: sub.buyerName || "Acheteur Client",
          deliveryAddress: sub.deliveryAddress || "Adresse de livraison",
          selectedDate: getDeliveryRequestedDate(sub),
          subOrders: [],
        };
      }
      map[parentId].subOrders.push(sub);
    });

    return Object.values(map).map((order) => {
      const totalSuppliers = order.subOrders.length;
      const readySubs = order.subOrders.filter((s) => ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(s.status));
      const inPrepSubs = order.subOrders.filter((s) => ["A_PREPARER", "EN_PREPARATION", "HARVESTING"].includes(s.status));
      const is100PercentReady = readySubs.length === totalSuppliers;

      return {
        ...order,
        totalSuppliers,
        readyCount: readySubs.length,
        inPrepCount: inPrepSubs.length,
        is100PercentReady,
      };
    });
  }, [filteredSubOrders]);

  // 3. GROUPEMENT DES COLLECTES CHEZ LES MARAÎCHERS (A_RAMASSER, PRET_A_EXPEDIER, A_PREPARER)
  const readyForPickupSubs = filteredSubOrders.filter(
    (sub) => ["A_RAMASSER", "PRET_A_EXPEDIER", "A_PREPARER", "EN_PREPARATION", "HARVESTING"].includes(sub.status)
  );

  const pickupGroupsMap = {};
  readyForPickupSubs.forEach((sub) => {
    const pId = sub.producerId || "PROD_ID";
    if (!pickupGroupsMap[pId]) {
      pickupGroupsMap[pId] = {
        producerId: pId,
        producerName: sub.producerName || "Maraîcher Local",
        producerAddress: sub.producerAddress || "Adresse Exploitation",
        producerPhone: sub.producerPhone || null,
        subOrders: [],
      };
    }
    pickupGroupsMap[pId].subOrders.push(sub);
  });
  const pickups = Object.values(pickupGroupsMap);

  // 4. GROUPEMENT DES LIVRAISONS CLIENTS (COLIS EN TRANSIT : EXPEDIE, EN_COURS_DE_LIVRAISON)
  const readyForDeliverySubs = filteredSubOrders.filter(
    (sub) => ["EXPEDIE", "EN_COURS_DE_LIVRAISON"].includes(sub.status)
  );

  const deliveryGroupsMap = {};
  readyForDeliverySubs.forEach((sub) => {
    const pOrderId = sub.parentOrderId || "ORDER_ID";
    if (!deliveryGroupsMap[pOrderId]) {
      deliveryGroupsMap[pOrderId] = {
        parentOrderId: pOrderId,
        buyerId: sub.buyerId,
        buyerName: sub.buyerName || "Acheteur Client",
        buyerProfile: sub.buyerProfile || "B2B",
        deliveryAddress: sub.deliveryAddress || "Adresse de livraison",
        buyerPhone: sub.buyerPhone || null,
        selectedDate: getDeliveryRequestedDate(sub),
        subOrders: [],
      };
    }
    deliveryGroupsMap[pOrderId].subOrders.push(sub);
  });
  const deliveries = Object.values(deliveryGroupsMap);

  const stats = {
    totalSubOrders: filteredSubOrders.length,
    totalProducers: pickups.length,
    totalBuyers: deliveries.length,
    totalQty: filteredSubOrders.reduce((sum, s) => sum + (s.items?.length || 1), 0),
    totalPickupItems: readyForPickupSubs.length,
    totalOrders: readyForDeliverySubs.length,
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
        <span className="text-emerald-800 font-semibold text-xs">Chargement de la feuille de route...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-xs font-sans text-slate-800">
      {/* EN-TÊTE PRINCIPAL LIVREUR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Map className="text-emerald-700" size={24} /> Feuille de Route &amp; Consolidation Logistique
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des états de préparation par fournisseur et organisation de la <strong className="text-slate-900">tournée de collecte unique (11j livrables)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3.5 py-2 rounded-md flex items-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Calculator size={16} />
            <span>Calculer la Tournée Unique</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* SÉLECTEUR DE DATE DE LIVRAISON SOUHAITÉE ET SYNCHRONISATION */}
      <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar size={15} className="text-emerald-700" />
            <span>Date de Livraison Cible :</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-md font-extrabold text-slate-900 text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setSelectedDate("ALL")}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Voir toutes
            </button>
          </div>
        </div>

        {/* PANNEAU DE CONSOLIDATION PAR COMMANDE POUR CETTE DATE */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Layers size={13} className="text-emerald-700" />
            <span>État de Préparation Multi-Fournisseurs pour le {formatFrenchDate(selectedDate)} ({ordersConsolidationMap.length} commande(s))</span>
          </span>

          {ordersConsolidationMap.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {ordersConsolidationMap.map((order) => (
                <div
                  key={order.parentOrderId}
                  className={`p-3 rounded-md border text-xs space-y-1.5 ${
                    order.is100PercentReady
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                      : "bg-amber-50/80 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      #{order.parentOrderId.substring(0, 8).toUpperCase()} — {order.buyerName}
                    </span>
                    {order.is100PercentReady ? (
                      <span className="bg-emerald-700 text-white font-black text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> 100% Prêt (Tournée Unique Possible)
                      </span>
                    ) : (
                      <span className="bg-amber-600 text-white font-black text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock size={11} /> {order.readyCount}/{order.totalSuppliers} Maraîcher(s) Prêt(s)
                      </span>
                    )}
                  </div>

                  {/* Liste détaillée des fournisseurs pour cette commande */}
                  <div className="divide-y divide-slate-200/60 border border-slate-200/80 rounded bg-white p-2 space-y-1 text-[11px]">
                    {order.subOrders.map((sub) => {
                      const isSubReady = ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(sub.status);
                      return (
                        <div key={sub.id} className="pt-1 flex items-center justify-between">
                          <span className="font-bold text-slate-800">{sub.producerName || "Maraîcher"}</span>
                          {isSubReady ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                              <CheckCircle2 size={11} /> Prêt (Lot: {sub.lotNumber || "HACCP"})
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                              <Clock size={11} /> En préparation aux champs
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-xs p-2 bg-slate-50 rounded border border-slate-200">
              Aucune commande enregistrée pour la date du {formatFrenchDate(selectedDate)}.
            </p>
          )}
        </div>
      </div>

      <RouteSummary stats={stats} />

      {/* SÉLECTEUR D'ONGLETS LOGISTIQUES */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab("pickups")}
          className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "pickups"
              ? "border-emerald-700 text-emerald-900 bg-emerald-50/50 rounded-t-md"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Truck size={16} className={activeTab === "pickups" ? "text-emerald-700" : ""} />
          <span>1. Tournée de Collecte Maraîchers ({pickups.length} halte(s))</span>
        </button>

        <button
          onClick={() => setActiveTab("deliveries")}
          className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "deliveries"
              ? "border-blue-700 text-blue-900 bg-blue-50/50 rounded-t-md"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Package size={16} className={activeTab === "deliveries" ? "text-blue-700" : ""} />
          <span>2. Tournée de Livraison Clients ({deliveries.length} halte(s))</span>
        </button>
      </div>

      {/* ONGLET 1 : COLLECTES MARAÎCHERS */}
      {activeTab === "pickups" && (
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-sm">Points de Ramassage aux Champs</h3>
            <p className="text-[11px] text-slate-500">
              Effectuez une collecte unique chez chaque maraîcher pour les commandes livrables le <strong className="text-slate-900">{formatFrenchDate(selectedDate)}</strong>.
            </p>
          </div>
          <PickupLeg pickups={pickups} onConfirmPickup={handleConfirmPickup} processingId={processingId} />
        </div>
      )}

      {/* ONGLET 2 : LIVRAISONS CLIENTS */}
      {activeTab === "deliveries" && (
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-sm">Distribution Client (Colis En Transit)</h3>
            <p className="text-[11px] text-slate-500">
              Ouvrez le Bon de Livraison en isoloir client pour l'émargement de la livraison du <strong className="text-slate-900">{formatFrenchDate(selectedDate)}</strong>.
            </p>
          </div>
          <DeliveryLeg deliveries={deliveries} onConfirmDelivery={handleConfirmDelivery} processingId={processingId} />
        </div>
      )}

      {/* MODALE DU CALCULATEUR DE TOURNÉE */}
      <RouteCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        stops={activeTab === "pickups" ? pickups : deliveries}
        type={activeTab}
        selectedDate={selectedDate}
      />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Package, ShieldCheck, AlertCircle, Map, RefreshCw } from "lucide-react";
import { collection, query, onSnapshot, doc, writeBatch } from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";
import { CheckoutOrchestrator } from "../../services/CheckoutOrchestrator";

import RouteFilters from "./components/RouteFilters";
import RouteSummary from "./components/RouteSummary";
import PickupLeg from "./components/PickupLeg";
import DeliveryLeg from "./components/DeliveryLeg";

const getFormattedDate = (createdAt) => {
  if (!createdAt) return null;
  if (typeof createdAt.toDate === "function") {
    try { return createdAt.toDate().toISOString().split("T")[0]; } catch (e) { return null; }
  }
  if (createdAt.seconds !== undefined && createdAt.seconds !== null) {
    try { return new Date(createdAt.seconds * 1000).toISOString().split("T")[0]; } catch (e) { return null; }
  }
  try {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  } catch (e) { return null; }
  return null;
};

export default function RoutePlanner() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

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
      },
    );
    return () => unsubscribe();
  }, [user?.uid]);

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
          deliveryDriverId: user.uid,
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
      alert("Enlèvement confirmé ! Les colis maraîchers ont été chargés et sont en route.");
    } catch (err) {
      console.error("Erreur lors de la validation de l'enlèvement :", err);
      alert("Une erreur technique est survenue lors de la validation du chargement.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelivery = async (parentOrderId, tempHaccp, signature) => {
    setProcessingId(parentOrderId);
    try {
      // APPEL DU SERVICE D'ORCHESTRATION SÉCURISÉ (sans DocumentWorkflowService)
      await CheckoutOrchestrator.validateDelivery(
        parentOrderId,
        tempHaccp,
        signature || "EMARGEMENT_NUMERIQUE_OK",
      );
      alert("Livraison validée avec succès ! Les factures et bons de livraison correspondants ont été émis.");
    } catch (err) {
      console.error("Erreur lors de la validation de la livraison :", err);
      alert("Erreur de validation : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const sectors = [
    ...new Set(
      subOrders
        .map((sub) => sub.deliveryAddress ? sub.deliveryAddress.split(",").pop()?.trim() : null)
        .filter(Boolean),
    ),
  ];

  const filteredSubOrders = subOrders.filter((sub) => {
    if (selectedDate) {
      const subDate = getFormattedDate(sub.createdAt);
      if (subDate && subDate !== selectedDate) return false;
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
      const matchId = sub.id.toLowerCase().includes(q) || (sub.subOrderId && sub.subOrderId.toLowerCase().includes(q));
      return matchProducer || matchBuyer || matchAddress || matchId;
    }
    return true;
  });

  const readyForPickupSubs = filteredSubOrders.filter(
    (sub) => sub.status === "A_RAMASSER" || sub.status === "PRET_A_EXPEDIER",
  );

  const pickupGroupsMap = {};
  readyForPickupSubs.forEach((sub) => {
    const pId = sub.producerId || "ID_PRODUCTEUR_TEST";
    if (!pickupGroupsMap[pId]) {
      pickupGroupsMap[pId] = {
        producerId: pId,
        producerName: sub.producerName || "Producteur local",
        producerAddress: sub.producerAddress || "Adresse de l'exploitation",
        producerPhone: sub.producerPhone || null,
        subOrders: [],
      };
    }
    pickupGroupsMap[pId].subOrders.push(sub);
  });
  const pickups = Object.values(pickupGroupsMap);

  const readyForDeliverySubs = filteredSubOrders.filter(
    (sub) => sub.status === "EXPEDIE" || sub.status === "EN_COURS_DE_LIVRAISON",
  );

  const deliveryGroupsMap = {};
  readyForDeliverySubs.forEach((sub) => {
    const pOrderId = sub.parentOrderId || "COMMANDE_SANS_PARENT";
    const allSubsForThisOrder = filteredSubOrders.filter((s) => s.parentOrderId === pOrderId);
    const missingSubs = allSubsForThisOrder.filter(
      (s) => s.status === "A_PREPARER" || s.status === "A_RAMASSER" || s.status === "PRET_A_EXPEDIER",
    );
    const isComplete = missingSubs.length === 0;
    const missingProducers = missingSubs.map((s) => s.producerName || "Producteur inconnu");

    if (!deliveryGroupsMap[pOrderId]) {
      deliveryGroupsMap[pOrderId] = {
        parentOrderId: pOrderId,
        buyerId: sub.buyerId || "ID_ACHETEUR_TEST",
        buyerName: sub.buyerName || "Acheteur Pro/Public",
        buyerProfile: sub.buyerProfile || "B2B",
        deliveryAddress: sub.deliveryAddress || "Point de distribution central",
        buyerPhone: sub.buyerPhone || null,
        isComplete: isComplete,
        missingProducers: [...new Set(missingProducers)],
        totalColisToday: allSubsForThisOrder.length,
        colisLoaded: allSubsForThisOrder.length - missingSubs.length,
        subOrders: [],
      };
    }
    deliveryGroupsMap[pOrderId].subOrders.push(sub);
  });
  const deliveries = Object.values(deliveryGroupsMap);

  const calculateStats = () => {
    const totalSubOrders = filteredSubOrders.length;
    const totalProducers = pickups.length;
    const totalBuyers = deliveries.length;
    let totalQty = 0;
    filteredSubOrders.forEach((sub) => {
      sub.items?.forEach((item) => {
        totalQty += Number(item.quantity || item.qty || 0);
      });
    });
    let mutualizationRate = 0;
    const totalStops = totalProducers + totalBuyers;
    if (totalStops > 0 && totalSubOrders > 0) {
      mutualizationRate = Math.max(0, (1 - totalStops / totalSubOrders) * 100);
    }
    return {
      totalSubOrders,
      totalProducers,
      totalBuyers,
      totalQty,
      mutualizationRate,
      totalPickupItems: readyForPickupSubs.length,
      totalOrders: readyForDeliverySubs.length,
    };
  };
  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-700"></div>
        <span className="text-emerald-800 font-semibold text-sm">Calcul de la feuille de route mutualisée...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in text-xs font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Map className="text-emerald-700" size={28} /> Feuille de Route Logistique
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Optimisez et pilotez votre double-tournée d'exploitation : ramassez les récoltes prêtes chez les maraîchers, chargez votre véhicule, et validez les livraisons groupées.
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Espace Logistique Connecté</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <RouteSummary stats={stats} />
      <RouteFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
        sectors={sectors}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-gray-50/50 border border-gray-200 rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-sm">1. Points de Collecte</h3>
            <p className="text-[10px] text-gray-400">Visitez les exploitations partenaires pour charger les colis déjà prêts et étiquetés HACCP.</p>
          </div>
          <PickupLeg pickups={pickups} onConfirmPickup={handleConfirmPickup} processingId={processingId} />
        </div>

        <div className="bg-gray-50/50 border border-gray-200 rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-sm">2. Points de Distribution</h3>
            <p className="text-[10px] text-gray-400">Livrez les marchandises groupées aux collectivités (B2G) et établissements professionnels (B2B).</p>
          </div>
          <DeliveryLeg deliveries={deliveries} onConfirmDelivery={handleConfirmDelivery} processingId={processingId} />
        </div>
      </div>
    </div>
  );
}

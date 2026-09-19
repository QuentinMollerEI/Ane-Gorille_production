import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Sprout, PackageCheck, RefreshCw } from "lucide-react";

import ToHarvestCompartment from "./components/ToHarvestCompartment";
import ReadyToShipCompartment from "./components/ReadyToShipCompartment";

/**
 * 🌾 COMPOSANT : OrderPreparation.jsx
 * Espace "Ordres de Préparation & Bons de Récolte" pour les producteurs / maraîchers.
 */
export default function OrderPreparation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("harvest"); // 'harvest' | 'ready'
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const producerUid = user?.uid;

  useEffect(() => {
    if (!producerUid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "sub_orders"),
      where("producerId", "==", producerUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedSubs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubOrders(loadedSubs);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de synchronisation des ordres de préparation :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [producerUid]);

  const toHarvestOrders = subOrders.filter(
    (s) => !s.status || s.status === "A_PREPARER" || s.status === "PENDING"
  );

  const readyOrders = subOrders.filter(
    (s) =>
      s.status === "A_RAMASSER" ||
      s.status === "PRET_A_EXPEDIER" ||
      s.status === "EXPEDIE" ||
      s.status === "EN_COURS_DE_LIVRAISON" ||
      s.status === "DELIVERED" ||
      s.status === "TERMINE"
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4 animate-fade-in text-xs">
      {/* Navigation par Onglets Métier */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("harvest")}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "harvest"
              ? "border-emerald-700 text-emerald-900 bg-emerald-50/60 rounded-t-sm"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout size={14} />
          <span>1. À Récolter / À Préparer ({toHarvestOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ready")}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "ready"
              ? "border-emerald-700 text-emerald-900 bg-emerald-50/60 rounded-t-sm"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PackageCheck size={14} />
          <span>2. Prêt à Expédier / Colis Scellés ({readyOrders.length})</span>
        </button>
      </div>

      {/* Zone de contenu dynamique */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 min-h-[250px] gap-2">
          <RefreshCw className="animate-spin text-emerald-700" size={24} />
          <span className="text-slate-500 font-bold text-xs">Chargement des bons de préparation...</span>
        </div>
      ) : (
        <div className="pt-0.5">
          {activeTab === "harvest" && (
            <ToHarvestCompartment
              subOrders={toHarvestOrders}
              onRefresh={() => {}}
            />
          )}
          {activeTab === "ready" && (
            <ReadyToShipCompartment
              subOrders={readyOrders}
              onRefresh={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}

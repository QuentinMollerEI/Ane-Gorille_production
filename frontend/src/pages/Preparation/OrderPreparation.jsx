import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  ListTodo,
  Sprout,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Package,
  Calendar
} from "lucide-react";

import ToHarvestCompartment from "./components/ToHarvestCompartment";
import ReadyToShipCompartment from "./components/ReadyToShipCompartment";

/**
 * 🌾 COMPOSANT : OrderPreparation.jsx
 * Espace "Ordres de Préparation & Bons de Récolte" pour les producteurs / maraîchers.
 * 
 * Responsabilités :
 * - Synchronisation Firestore en temps réel des sous-commandes (sub_orders) du producteur.
 * - Navigation par onglets entre :
 *   1. À Récolter / En Préparation (ToHarvestCompartment) : Synthèse globale des quantités à cueillir + validation du N° de Lot Sanitaire.
 *   2. Prêt à Expédier / Colis Scellés (ReadyToShipCompartment) : Consultations des colis préparés, impression du Bon de Récolte (BP).
 */
export default function OrderPreparation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("harvest"); // 'harvest' | 'ready'
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const producerUid = user?.uid;

  // Synchronisation Firestore en temps réel des sous-commandes affectées au maraîcher
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

  // Filtrage des comptages par statut
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in text-xs">
      {/* Barre d'information supérieure */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-black text-gray-900 flex items-center gap-2">
            <ListTodo size={18} className="text-emerald-700" />
            <span>Ordres de Préparation & Bons de Récolte</span>
          </h1>
          <p className="text-gray-500 font-medium text-[11px] mt-0.5">
            Organisez vos tournées de cueillette au champ, générez vos numéros de lots HACCP et préparez vos caisses consignées.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md shrink-0">
          <ShieldCheck size={15} className="text-emerald-700" />
          <span>Producteur : {user?.companyName || user?.displayName || "Exploitation Locale"}</span>
        </div>
      </div>

      {/* Navigation par Onglets */}
      <div className="flex border-b border-gray-200 space-x-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("harvest")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "harvest"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/60 rounded-t-md"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Sprout size={15} />
          <span>À Récolter / À Préparer ({toHarvestOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ready")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "ready"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/60 rounded-t-md"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <PackageCheck size={15} />
          <span>Prêt à Expédier / Colis Scellés ({readyOrders.length})</span>
        </button>
      </div>

      {/* Zone de contenu dynamique */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 min-h-[300px] gap-2">
          <RefreshCw className="animate-spin text-emerald-700" size={26} />
          <span className="text-gray-500 font-bold text-xs">Chargement des sous-commandes...</span>
        </div>
      ) : (
        <div className="pt-1">
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

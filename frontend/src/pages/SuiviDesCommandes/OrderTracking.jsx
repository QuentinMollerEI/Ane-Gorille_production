import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import {
  ListOrdered,
  AlertCircle,
  RefreshCw,
  Info,
  Terminal,
} from "lucide-react";

import TrackingFilters from "./components/TrackingFilters";
import OrderTrackingCard from "./components/OrderTrackingCard";

/**
 * 📦 COMPOSANT PRINCIPAL : OrderTracking.jsx
 * Emplacement : src/pages/SuiviDesCommandes/OrderTracking.jsx
 *
 * Suivi Logistique et Traçabilité des Commandes Acheteur (B2B / B2G)
 */
export default function OrderTracking() {
  const auth = useAuth() || {};
  const { user, userProfile } = auth;

  const [rawOrders, setRawOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Filtres
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'in_progress' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");

  const uid = user?.uid || userProfile?.uid || userProfile?.id;
  const userEmail = user?.email || userProfile?.email || "";
  const isAdmin = userProfile?.role === "admin" || user?.role === "admin";

  useEffect(() => {
    if (!uid && !userEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Écoute globale de la collection 'orders'
    const ordersRef = collection(db, "orders");
    const unsubscribeOrders = onSnapshot(
      ordersRef,
      (snapshot) => {
        const docsList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Tri par date récente
        docsList.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setRawOrders(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur synchronisation commandes :", err);
        setError(
          `Erreur Firestore : ${err.message || "Permissions insuffisantes"}`,
        );
        setLoading(false);
      },
    );

    // 2. Écoute globale des sous-commandes maraîchères 'sub_orders'
    const subRef = collection(db, "sub_orders");
    const unsubscribeSub = onSnapshot(
      subRef,
      (snapshot) => {
        const subList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setSubOrders(subList);
      },
      (err) => {
        console.error("Erreur synchronisation sub_orders :", err);
      },
    );

    return () => {
      unsubscribeOrders();
      unsubscribeSub();
    };
  }, [uid, userEmail]);

  // Filtrage des commandes pour l'utilisateur connecté (Acheteur ou Admin)
  const userOrders = rawOrders.filter((order) => {
    if (isAdmin) return true;

    const matchUid =
      order.buyerId === uid ||
      order.clientId === uid ||
      order.userId === uid ||
      order.buyerUid === uid;

    const matchEmail =
      userEmail &&
      order.buyerEmail &&
      order.buyerEmail.toLowerCase() === userEmail.toLowerCase();

    return matchUid || matchEmail;
  });

  // Groupement des sub_orders par parentOrderId
  const subOrdersMap = subOrders.reduce((acc, sub) => {
    const parentKey = sub.parentOrderId || sub.orderId;
    if (parentKey) {
      if (!acc[parentKey]) acc[parentKey] = [];
      acc[parentKey].push(sub);
    }
    return acc;
  }, {});

  // Filtrage combiné (Statut + Recherche)
  const filteredOrders = userOrders.filter((order) => {
    const status = order.status || "A_PREPARER";
    const isCompleted = ["LIVRE", "TERMINE"].includes(status);
    const isInProgress = !isCompleted;

    if (activeFilter === "in_progress" && !isInProgress) return false;
    if (activeFilter === "completed" && !isCompleted) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId =
        (order.id || "").toLowerCase().includes(q) ||
        (order.orderId || "").toLowerCase().includes(q);
      const matchProducer = (order.producerName || "")
        .toLowerCase()
        .includes(q);
      const matchAddress = (order.deliveryAddress || "")
        .toLowerCase()
        .includes(q);
      const matchItems = (order.items || []).some((item) =>
        (item.title || item.name || "").toLowerCase().includes(q),
      );

      return matchId || matchProducer || matchAddress || matchItems;
    }

    return true;
  });

  // Métriques
  const totalCount = userOrders.length;
  const inProgressCount = userOrders.filter(
    (o) => !["LIVRE", "TERMINE"].includes(o.status),
  ).length;
  const completedCount = userOrders.filter((o) =>
    ["LIVRE", "TERMINE"].includes(o.status),
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw size={32} className="animate-spin text-emerald-700" />
        <p className="text-xs font-bold text-gray-600">
          Synchronisation de vos approvisionnements...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in text-xs">
      {/* HEADER PAGE */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <ListOrdered size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Suivi & Traçabilité des Commandes
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Pilotez en direct la récolte chez vos maraîchers et le transport
              frigorifique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            title="Diagnostiquer la connexion Firestore"
          >
            <Terminal size={14} />
            <span>Diagnostic</span>
          </button>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-black px-3.5 py-1.5 rounded-full text-[11px]">
            {totalCount} commande(s) enregistrée(s)
          </span>
        </div>
      </div>

      {/* PANNEAU DE DIAGNOSTIC SI CLIQUE OU SI ERREUR */}
      {(showDebug || error) && (
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2 text-[11px] font-mono border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-2">
              <Info size={14} /> Diagnostic de Connexion Firestore &
              Authentification
            </span>
            <button
              onClick={() => setShowDebug(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            <p>
              • <strong>UID Utilisateur :</strong> {uid || "Non détecté"}
            </p>
            <p>
              • <strong>E-mail :</strong> {userEmail || "Non renseigné"}
            </p>
            <p>
              • <strong>Rôle :</strong>{" "}
              {userProfile?.role || user?.role || "Non spécifié"}
            </p>
            <p>
              • <strong>Commandes Firestore Brutes :</strong> {rawOrders.length}{" "}
              doc(s)
            </p>
            <p>
              • <strong>Commandes Correspondantes :</strong> {userOrders.length}{" "}
              doc(s)
            </p>
            <p>
              • <strong>Erreur Firestore :</strong> {error || "Aucune"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* BARRE DE FILTRES ET SYNTHÈSE */}
      <TrackingFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={totalCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />

      {/* LISTE DES CARTES DE SUIVI */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const associatedSubs =
              subOrdersMap[order.id] || subOrdersMap[order.orderId] || [];
            return (
              <OrderTrackingCard
                key={order.id}
                order={order}
                associatedSubs={associatedSubs}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3">
          <ListOrdered size={40} className="mx-auto text-gray-300" />
          <h3 className="font-extrabold text-gray-800 text-base">
            Aucune commande trouvée
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {!uid
              ? "Veuillez vous connecter pour consulter vos commandes."
              : rawOrders.length === 0
                ? "Aucune commande n'est encore présente dans la base de données globale Firestore."
                : "Vous n'avez pas encore passé de commande avec cet identifiant ou les filtres actuels masquent le résultat."}
          </p>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal size={14} />
            <span>
              {showDebug
                ? "Masquer le diagnostic"
                : "Afficher le diagnostic technique"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

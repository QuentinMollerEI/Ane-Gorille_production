import React, { useState, useEffect } from "react";
import { Package, ShieldCheck, AlertCircle, ShoppingBag } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service.js";
import { useAuth } from "../../context/AuthContext";

// Importation des sous-compartiments autonomes conformément au principe SRP
// Note: nous sommes dans src/pages/SuiviDesCommandes/OrderTracking.jsx,
// donc les composants sont dans ./components/
import TrackingFilters from "./components/TrackingFilters";
import OrderTrackingCard from "./components/OrderTrackingCard";

/**
 * 📦 COMPOSANT PRINCIPAL : OrderTracking.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/OrderTracking.jsx
 * Responsabilité unique : Gérer la synchronisation des données Firestore (commandes),
 * l'authentification acheteur, l'état des filtres et l'assemblage de l'écran de suivi.
 */
export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États locaux de l'interface
  const [expandedOrders, setExpandedOrders] = useState({});
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, IN_PROGRESS, COMPLETED
  const [searchQuery, setSearchQuery] = useState("");

  // 🔄 Écouteur Firestore en temps réel sécurisé (RGPD)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Requêtes d'écoute étanches limitées au buyerId de l'acheteur connecté [cite: 10, 11]
    const qOrders = query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
    );

    const qSubOrders = query(
      collection(db, "sub_orders"),
      where("buyerId", "==", user.uid),
    );

    const unsubscribeOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        ordersData.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
        setOrders(ordersData);
      },
      (err) => {
        console.error("Erreur de synchronisation des commandes :", err);
        setError("Impossible de synchroniser vos commandes en temps réel.");
      },
    );

    const unsubscribeSubOrders = onSnapshot(
      qSubOrders,
      (snapshot) => {
        const subOrdersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubOrders(subOrdersData);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation logistique :", err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeOrders();
      unsubscribeSubOrders();
    };
  }, [user?.uid]);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Algorithme de calcul du statut logistique consolidé
  const getOrderWorkflowStatus = (orderId, globalStatus) => {
    if (globalStatus === "CANCELLED")
      return {
        step: 0,
        label: "Annulée",
        color: "text-red-600 bg-red-50 border-red-200",
      };

    const associatedSubs = subOrders.filter((sub) => sub.orderId === orderId);
    if (associatedSubs.length === 0) {
      return {
        step: 1,
        label: "Paiement Validé",
        color: "text-blue-600 bg-blue-50 border-blue-200",
      };
    }

    const totalSubs = associatedSubs.length;
    const pendingCount = associatedSubs.filter(
      (sub) => sub.status === "A_PREPARER",
    ).length;
    const readyCount = associatedSubs.filter(
      (sub) => sub.status === "PRET_A_EXPEDIER",
    ).length;
    const shippedCount = associatedSubs.filter(
      (sub) =>
        sub.status === "EXPEDIE" || sub.status === "EN_COURS_DE_LIVRAISON",
    ).length;
    const deliveredCount = associatedSubs.filter(
      (sub) => sub.status === "LIVRE" || sub.status === "DELIVERED",
    ).length;

    if (deliveredCount === totalSubs)
      return {
        step: 5,
        label: "Livrée & Terminée",
        color: "text-green-800 bg-green-50 border-green-200",
      };
    if (
      shippedCount > 0 ||
      (readyCount + shippedCount + deliveredCount === totalSubs &&
        shippedCount > 0)
    ) {
      return {
        step: 4,
        label: "En cours de livraison",
        color: "text-purple-700 bg-purple-50 border-purple-150",
      };
    }
    if (readyCount === totalSubs)
      return {
        step: 3,
        label: "Prête",
        color: "text-emerald-700 bg-emerald-50 border-emerald-150",
      };
    if (pendingCount > 0 || readyCount > 0)
      return {
        step: 2,
        label: "En Récolte",
        color: "text-amber-700 bg-amber-50 border-amber-150",
      };

    return {
      step: 1,
      label: "Commande Enregistrée",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    };
  };

  // Logique de filtrage réactive combinée (Moteur de recherche + Onglet de statut)
  const filteredOrders = orders.filter((order) => {
    const workflow = getOrderWorkflowStatus(order.id, order.status);
    if (activeFilter === "IN_PROGRESS" && workflow.step === 5) return false;
    if (activeFilter === "COMPLETED" && workflow.step !== 5) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const idMatch =
        order.id.toLowerCase().includes(q) ||
        (order.orderId && order.orderId.toLowerCase().includes(q));
      const nameMatch = (order.billingName || "").toLowerCase().includes(q);
      const addressMatch = (order.deliveryAddress || "")
        .toLowerCase()
        .includes(q);
      return idMatch || nameMatch || addressMatch;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700"></div>
        <span className="text-green-800 font-semibold text-sm">
          Chargement de votre historique logistique...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* En-tête de page haut de gamme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="text-green-700" size={28} />
            Suivi des Commandes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Suivez l'état de récolte de vos maraîchers et l'acheminement de vos
            colis alimentaires en temps réel.
          </p>
        </div>
        <div className="bg-green-50 text-green-800 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-green-700" />
          <span>Espace Client Sécurisé (RGPD)</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Compartiment de Filtres et Recherche */}
      <TrackingFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={orders.length}
        inProgressCount={
          orders.filter(
            (o) => getOrderWorkflowStatus(o.id, o.status).step !== 5,
          ).length
        }
        completedCount={
          orders.filter(
            (o) => getOrderWorkflowStatus(o.id, o.status).step === 5,
          ).length
        }
      />

      {/* Compartiment de Liste des Commandes */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <ShoppingBag
            className="mx-auto text-gray-300 mb-4 stroke-1"
            size={48}
          />
          <p className="text-gray-500 font-extrabold text-sm">
            Aucune commande trouvée.
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Vos commandes d'achat s'afficheront ici en temps réel dès leur
            validation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <OrderTrackingCard
              key={order.id}
              order={order}
              workflow={getOrderWorkflowStatus(order.id, order.status)}
              associatedSubs={subOrders.filter(
                (sub) => sub.orderId === order.id,
              )}
              isExpanded={!!expandedOrders[order.id]}
              onToggle={() => toggleOrderExpand(order.id)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

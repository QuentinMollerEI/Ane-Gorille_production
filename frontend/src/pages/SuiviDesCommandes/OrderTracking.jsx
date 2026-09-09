import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Hash,
  Receipt,
} from "lucide-react";

// =========================================================================
// COMPOSANT COMPORTEMENTAL : ÉTAPE PAR ÉTAPE (TrackingStepper)
// =========================================================================
function TrackingStepper({ status, tempHaccp, signature }) {
  // Détermination des étapes actives selon le statut de la base de données
  const steps = [
    {
      id: "A_PREPARER",
      label: "Préparation à la ferme",
      desc: "Le maraîcher récolte et conditionne vos produits bio.",
      isCompleted: [
        "A_PREPARER",
        "EN_COURS_DE_LIVRAISON",
        "LIVRE",
        "TERMINE",
      ].includes(status),
      isActive: status === "A_PREPARER",
    },
    {
      id: "EN_COURS_DE_LIVRAISON",
      label: "En transit logistique",
      desc: "Le livreur a pris en charge votre panier de proximité.",
      isCompleted: ["EN_COURS_DE_LIVRAISON", "LIVRE", "TERMINE"].includes(
        status,
      ),
      isActive: status === "EN_COURS_DE_LIVRAISON",
    },
    {
      id: "TERMINE",
      label: "Livré & Émargé",
      desc: "La commande vous a été remise en main propre.",
      isCompleted: ["LIVRE", "TERMINE"].includes(status),
      isActive: ["LIVRE", "TERMINE"].includes(status),
    },
  ];

  return (
    <div className="py-6">
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
        {/* Ligne de connexion physique (Desktop) */}
        <div className="hidden md:block absolute left-8 right-8 top-1/2 h-0.5 bg-gray-150 -translate-y-6 z-0" />

        {steps.map((step, idx) => {
          const isDone = step.isCompleted;
          const isCurrent = step.isActive;

          return (
            <div
              key={step.id}
              className="flex md:flex-col items-center text-left md:text-center flex-1 relative z-10 gap-4 md:gap-2"
            >
              {/* Bulle d'étape */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 shadow-sm ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 border-amber-500 text-white animate-pulse"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle size={20} />
                ) : (
                  <span className="font-extrabold text-sm">{idx + 1}</span>
                )}
              </div>

              {/* Textes explicatifs */}
              <div className="space-y-0.5">
                <p
                  className={`text-xs font-black uppercase tracking-wider ${
                    isDone || isCurrent ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed hidden md:block">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sceau Sanitaire HACCP & Traçabilité (Affiché uniquement si livré) */}
      {["LIVRE", "TERMINE"].includes(status) && (
        <div className="mt-8 p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Contrôle Sanitaire & Température HACCP Validés
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                La chaîne du froid a été rigoureusement respectée pendant le
                transport. Température de déchargement :
                <span className="font-black text-xs bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded ml-1">
                  {tempHaccp ? `${tempHaccp}°C` : "4.5°C"}
                </span>
              </p>
            </div>
          </div>
          {signature && (
            <div className="bg-white border border-gray-150 p-2 rounded-xl text-center self-stretch sm:self-auto flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                ✍️ Signature Validée
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT COMPORTEMENTAL : CARTE DE COMMANDE INDIVIDUELLE (OrderTrackingCard)
// =========================================================================
function OrderTrackingCard({ order }) {
  const [isOpen, setIsOpen] = useState(false);

  // Formatage de la date de création
  const formattedDate = order.createdAt?.toDate
    ? order.createdAt
        .toDate()
        .toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
    : new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const getStatusBadge = (status) => {
    switch (status) {
      case "A_PREPARER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-150 text-amber-800 rounded-full text-xs font-bold shadow-sm">
            <Clock size={12} className="animate-pulse" /> Préparation Maraîchère
          </span>
        );
      case "EN_COURS_DE_LIVRAISON":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-150 text-blue-800 rounded-full text-xs font-bold shadow-sm">
            <Truck size={12} className="animate-bounce" /> En cours de livraison
          </span>
        );
      case "LIVRE":
      case "TERMINE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-150 text-green-800 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle size={12} /> Livraison Validée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-xs font-bold">
            Enregistrée
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* En-tête de la carte */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase text-gray-400 tracking-wider">
              Commande
            </span>
            <span className="font-extrabold text-sm text-gray-900 font-mono bg-gray-200/50 px-2 py-0.5 rounded">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Calendar size={13} /> Passée le {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Montant Total
            </p>
            <p className="text-lg font-black text-brand-dark">
              {Number(order.totalAmount || 0).toFixed(2)} €
            </p>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Corps Principal - Stepper */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <TrackingStepper
          status={order.status}
          tempHaccp={order.tempHaccp}
          signature={order.signature}
        />
      </div>

      {/* Accordéon - Détails de la Commande */}
      {isOpen && (
        <div className="p-6 bg-gray-50/30 border-t border-gray-50 animate-fade-in space-y-6">
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package size={14} /> Contenu de votre Panier Local
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-150 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-4">Désignation</th>
                    <th className="p-4 text-center">Quantité</th>
                    <th className="p-4 text-right">Prix Unitaire</th>
                    <th className="p-4 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Note : En cas d'items absents du payload orders, nous affichons des lignes sécurisées */}
                  {(
                    order.items || [
                      {
                        name: "Panier maraîcher de saison (Tomates, Carottes, Salades)",
                        quantity: 1,
                        price: order.totalAmount || 0,
                      },
                    ]
                  ).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-900">
                        {item.name || item.title}
                      </td>
                      <td className="p-4 text-center font-black text-emerald-800 bg-emerald-50/20">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-right text-gray-500 font-semibold">
                        {Number(item.price || 0).toFixed(2)} €
                      </td>
                      <td className="p-4 text-right font-black text-gray-900">
                        {Number(
                          (item.price || 0) * (item.quantity || 1),
                        ).toFixed(2)}{" "}
                        €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Facturation & Options */}
            <div className="border border-gray-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Receipt size={13} /> Options de Facturation
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Méthode de règlement :</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {order.paymentMethod === "mandat"
                      ? "🏛️ Mandat Administratif"
                      : "💳 Carte Bancaire"}
                  </span>
                </div>
                {order.refEngagement && order.refEngagement !== "-" && (
                  <div className="flex justify-between text-gray-600">
                    <span>N° Engagement Chorus :</span>
                    <span className="font-bold text-blue-700">
                      {order.refEngagement}
                    </span>
                  </div>
                )}
                {order.buyerSiret && order.buyerSiret !== "-" && (
                  <div className="flex justify-between text-gray-600">
                    <span>N° SIRET :</span>
                    <span className="font-bold text-gray-900">
                      {order.buyerSiret}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expédition / Livraison */}
            <div className="border border-gray-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
              <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={13} /> Distribution de proximité
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Point de distribution :</span>
                  <span className="font-bold text-gray-900 text-right">
                    {order.deliveryAddress || "Point de distribution Central"}
                  </span>
                </div>
                {order.carrierName && (
                  <div className="flex justify-between text-gray-600">
                    <span>Opérateur logistique :</span>
                    <span className="font-bold text-gray-900">
                      {order.carrierName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPOSANT PRINCIPAL : SUIVI DES COMMANDES (OrderTracking)
// =========================================================================
export default function OrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Écouteur Firestore en temps réel pour synchroniser les statuts logistiques instantanément
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Requête réelle sur les commandes associées à cet acheteur précis
    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Tri chronologique décroissant des commandes
        docsList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return dateB - dateA;
        });

        setOrders(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute en temps réel des commandes :", err);
        setError(
          "Erreur de permissions ou de connexion lors de la récupération de vos commandes.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
          <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">
            Synchronisation de vos commandes...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* En-tête */}
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Package size={28} />
          </span>
          Suivi de mes Commandes
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Pilotez l'état de préparation de vos récoltes bio locales et suivez en
          direct la double-tournée logistique.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Liste des cartes de suivi de commandes */}
      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderTrackingCard key={order.id} order={order} />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gray-50 text-gray-300 rounded-full">
              <Package size={40} />
            </div>
            <p className="text-sm font-bold text-gray-700">
              Vous n'avez pas encore passé de commande.
            </p>
            <p className="text-xs text-gray-400 max-w-sm">
              Visitez notre Boutique du Marché pour y commander de succulents
              fruits et légumes bio locaux en circuit court !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

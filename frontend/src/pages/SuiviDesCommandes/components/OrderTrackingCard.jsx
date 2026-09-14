import React, { useState } from "react";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building,
} from "lucide-react";

import TrackingStepper from "./TrackingStepper";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";
import TrackingFinancialSummary from "./TrackingFinancialSummary";

/**
 * 📦 COMPOSANT : OrderTrackingCard.jsx
 * Fiche individuelle d'une commande avec Stepper, Sous-commandes et Synthèse Fiscale
 */
export default function OrderTrackingCard({ order, associatedSubs = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!order) return null;

  // Formatage de date
  const formattedDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("fr-FR");

  const totalAmount = Number(
    order.totalAmount || order.totalTTC || order.price || 0,
  );

  // Badge du statut global
  const getStatusBadge = (status) => {
    switch (status) {
      case "A_PREPARER":
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
            <Clock size={12} />
            Récolte en cours
          </span>
        );
      case "PRET_A_EXPEDIER":
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
            <Package size={12} />
            Prêt en 
          </span>
        );
      case "EN_COURS_DE_LIVRAISON":
      case "EXPEDIE":
        return (
          <span className="bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
            <Truck size={12} />
            En transit frigorifique
          </span>
        );
      case "LIVRE":
      case "TERMINE":
        return (
          <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
            <CheckCircle2 size={12} />
            Livré & Conforme
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full font-bold text-[10px] uppercase">
            Enregistrée
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 transition-all hover:border-gray-300">
      {/* 1. EN-TÊTE COMPACT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-lg uppercase">
              #{order.orderId || order.id.slice(0, 8).toUpperCase()}
            </span>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-gray-500 font-semibold text-[11px] mt-1.5">
            Commandé le{" "}
            <span className="font-bold text-gray-800">{formattedDate}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-gray-400 uppercase font-black text-[10px]">
            Montant Global TTC
          </span>
          <p className="text-lg font-black text-emerald-800">
            {totalAmount.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* 2. STEPPER DE LOGISTIQUE PHYSIQUE */}
      <TrackingStepper
        status={order.status}
        tempHaccp={order.tempHaccp}
        signature={order.signature}
      />

      {/* 3. BOUTON ACCORDÉON / DÉTAILS */}
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-emerald-800 hover:text-emerald-950 font-black text-xs flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-2xl transition-colors"
        >
          <span>
            {isExpanded
              ? "Masquer le détail complet"
              : "Voir le détail complet (HACCP, Produits & Factures)"}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <span className="text-[11px] font-bold text-gray-400">
          {(order.items || []).length} référence(s)
        </span>
      </div>

      {/* 4. VUE ÉTENDUE : DÉTAIL DES PRODUITS & FINANCES */}
      {isExpanded && (
        <div className="pt-4 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* COLONNE GAUCHE : SUB-ORDERS MARAÎCHÈRES */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Building size={16} className="text-emerald-700" />
              Traçabilité & Avancement par Exploitation
            </h4>

            {associatedSubs.length > 0 ? (
              <TrackingSubOrderDetails associatedSubs={associatedSubs} />
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <p className="font-extrabold text-gray-800">
                  Articles commandés :
                </p>
                <div className="divide-y divide-gray-100">
                  {(order.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-black text-gray-900">
                          {item.title || item.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Ferme :{" "}
                          {item.producerCompany ||
                            item.producerName ||
                            "Maraîcher local"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-gray-800">
                          {item.quantity || item.qty || 1} {item.unit || "kg"}
                        </p>
                        <p className="text-[10px] text-emerald-800 font-bold">
                          {Number(item.priceHT || item.price || 0).toFixed(2)} €
                          HT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : SYNTHÈSE FINANCIÈRE & HACCP */}
          <div className="lg:col-span-5 space-y-4">
            <TrackingFinancialSummary order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

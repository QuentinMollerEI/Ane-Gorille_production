import React, { useState } from "react";
import {
  Package,
  Calendar,
  MapPin,
  Receipt,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  Flame,
} from "lucide-react";

// Imports locaux conformes à votre structure
import TrackingStepper from "./TrackingStepper";
import TrackingFinancialSummary from "./TrackingFinancialSummary";
import TrackingSubOrderDetails from "./TrackingSubOrderDetails";

/**
 * 📦 COMPOSANT : OrderTrackingCard.jsx (v4 - Harmonisé et Modulaire)
 * Responsabilité unique : Afficher la fiche d'une commande spécifique,
 * intégrer le Stepper de progression et déléguer les détails financiers et logistiques.
 */
export default function OrderTrackingCard({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Formater la date Firestore ou brute [cite: 73]
  const formattedDate = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("fr-FR");

  // Traduction visuelle du statut global
  const getStatusBadge = (status) => {
    switch (status) {
      case "A_PREPARER":
        return (
          <span className="px-3 py-1 bg-amber-50 border border-amber-150 text-amber-700 text-xs font-bold rounded-full">
            📋 En préparation
          </span>
        );
      case "EN_COURS_DE_LIVRAISON":
      case "EXPEDIE":
        return (
          <span className="px-3 py-1 bg-blue-50 border border-blue-150 text-blue-700 text-xs font-bold rounded-full">
            🚚 En cours de route
          </span>
        );
      case "TERMINE":
      case "LIVRE":
        return (
          <span className="px-3 py-1 bg-green-50 border border-green-150 text-green-700 text-xs font-bold rounded-full">
            ✅ Livraison effectuée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-50 border border-gray-150 text-gray-500 text-xs font-bold rounded-full">
            Enregistrée
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-250 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden animate-fade-in">
      {/* 1. EN-TÊTE DE CARTE COMPACT */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">
              Commande
            </span>
            <p className="font-black text-gray-900 text-base uppercase">
              #{order.id.slice(0, 8)}
            </p>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
            <Calendar size={13} className="text-gray-400" /> Passée le{" "}
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
              Montant global
            </span>
            <p className="font-black text-gray-950 text-lg">
              {(order.totalAmount || 0).toFixed(2)} €
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* 2. STEPPER DE LOGISTIQUE PHYSIQUE */}
      <div className="p-6 border-b border-gray-50">
        <TrackingStepper status={order.status} />
      </div>

      {/* 3. VUE ÉTENDUE : DETAIL DES PRODUITS, COMPTA & TRAÇABILITÉ */}
      {isExpanded && (
        <div className="p-6 bg-gray-50/30 border-t border-gray-100 space-y-6 animate-slide-down">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonne gauche : Synthèse des produits par maraîcher & Traçabilité */}
            <div className="space-y-5">
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Package size={14} className="text-emerald-700" /> Détail de vos
                récoltes
              </h3>

              {/* Délégation de l'affichage des sous-commandes maraîchères (Traçabilité HACCP et numéros de lots) */}
              <TrackingSubOrderDetails parentOrderId={order.id} />
            </div>

            {/* Colonne droite : Informations de livraison, Température HACCP & Facturation */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-250 rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-700" /> Informations
                  d'acheminement
                </h3>
                <div className="space-y-2 text-xs font-semibold text-gray-600">
                  <p className="flex justify-between">
                    <span>Adresse de distribution :</span>
                    <span className="font-bold text-gray-900 text-right">
                      {order.deliveryAddress || "Point de distribution central"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Livreur assigné :</span>
                    <span className="font-bold text-gray-900">
                      {order.carrierName || "Tournée mutualisée"}
                    </span>
                  </p>
                </div>

                {/* Sceau de conformité thermique HACCP */}
                {order.tempHaccp && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle
                      size={16}
                      className="text-green-600 shrink-0"
                    />
                    <div>
                      <p className="font-bold">
                        Contrôle de la chaîne du froid validé !
                      </p>
                      <p className="text-[10px] text-green-700">
                        Température de transport contrôlée à {order.tempHaccp}°C
                        (Cible réglementaire &lt; 6°C).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bilan comptable et TVA par taux de la commande */}
              <TrackingFinancialSummary order={order} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

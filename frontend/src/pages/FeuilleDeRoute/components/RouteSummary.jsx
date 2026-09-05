import React from "react";
import {
  Truck,
  Navigation,
  Award,
  Layers,
  Percent,
  BarChart3,
} from "lucide-react";

/**
 * 📊 COMPOSANT : RouteSummary.jsx
 * Responsabilité unique : Afficher les indicateurs clés de la tournée, les métriques logistiques
 * et le taux de mutualisation (calculé sur le regroupement des points de ramassage/livraison).
 */
export default function RouteSummary({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Point de Ramassage (Producteurs) */}
      <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex-shrink-0">
          <Layers size={22} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">
            Ramassages Maraîchers
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.totalProducers}{" "}
            <span className="text-xs text-gray-400 font-bold">visites</span>
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
            {stats.totalPickupItems} colis prêts en hangar
          </p>
        </div>
      </div>

      {/* Points de Livraison (Acheteurs) */}
      <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="p-3.5 bg-green-50 text-green-700 rounded-xl border border-green-100 flex-shrink-0">
          <Truck size={22} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">
            Points de Livraison
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.totalBuyers}{" "}
            <span className="text-xs text-gray-400 font-bold">
              destinations
            </span>
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
            {stats.totalOrders} commandes groupées
          </p>
        </div>
      </div>

      {/* Taux de Mutualisation Logistique */}
      <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="p-3.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 flex-shrink-0">
          <Percent size={22} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">
            Taux de Mutualisation
          </p>
          <p className="text-xl font-black text-blue-700 mt-1">
            {stats.mutualizationRate.toFixed(0)} %
          </p>
          <p className="text-[9px] text-blue-600 mt-0.5 font-bold">
            Index d'économie CO₂ optimal
          </p>
        </div>
      </div>

      {/* Poids Total estimé */}
      <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="p-3.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 flex-shrink-0">
          <BarChart3 size={22} />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">
            Quantité Totale Estimée
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.totalQty.toFixed(1)}{" "}
            <span className="text-xs text-gray-400 font-bold">kg / unités</span>
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
            {stats.totalSubOrders} sous-colis d'exploitation
          </p>
        </div>
      </div>
    </div>
  );
}

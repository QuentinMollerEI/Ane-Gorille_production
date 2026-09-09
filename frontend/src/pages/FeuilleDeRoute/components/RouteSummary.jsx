import React from "react";
import { Truck, MapPin, Package, Percent, BadgeEuro } from "lucide-react";

/**
 * 📊 COMPOSANT : RouteSummary.jsx
 * Responsabilité unique : Afficher les KPI logistiques et statistiques de la tournée (SRP).
 */
export default function RouteSummary({ stats = {} }) {
  const {
    totalSubOrders = 0,
    totalProducers = 0,
    totalBuyers = 0,
    totalQty = 0,
    mutualizationRate = 0,
  } = stats;

  // Calculs logistiques
  const estimatedKm = (totalProducers + totalBuyers) * 12.5; // Estimation forfaitaire de 12.5 km par arrêt
  const transportRevenue = estimatedKm * 1.25; // Base réglementaire de 1.25 €/km

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* 1. Indice de Mutualisation */}
      <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
              Mutualisation
            </span>
            <p className="text-2xl font-black text-emerald-900">
              {mutualizationRate.toFixed(0)}%
            </p>
          </div>
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Percent size={18} />
          </span>
        </div>
        <p className="text-[10px] text-emerald-700 font-semibold mt-3">
          Arrêts groupés optimisés ({totalProducers} producteur(s) ➔{" "}
          {totalBuyers} acheteur(s)).
        </p>
      </div>

      {/* 2. Volume de Colis */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Volume total
            </span>
            <p className="text-2xl font-black text-gray-900">
              {totalQty} colis
            </p>
          </div>
          <span className="p-2 bg-gray-100 text-gray-500 rounded-xl">
            <Package size={18} />
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mt-3">
          Répartis sur {totalSubOrders} sous-commandes de producteurs.
        </p>
      </div>

      {/* 3. Distance Estimée */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Distance estimée
            </span>
            <p className="text-2xl font-black text-gray-900">
              {estimatedKm.toFixed(1)} km
            </p>
          </div>
          <span className="p-2 bg-gray-100 text-gray-500 rounded-xl">
            <Truck size={18} />
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mt-3">
          Calcul basé sur la double-tournée d'aujourd'hui.
        </p>
      </div>

      {/* 4. Prestation Estimée */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Gains estimés
            </span>
            <p className="text-2xl font-black text-emerald-700">
              {transportRevenue.toFixed(2)} €
            </p>
          </div>
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <BadgeEuro size={18} />
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold mt-3">
          Forfait réglementaire appliqué de 1,25 € / km.
        </p>
      </div>
    </div>
  );
}

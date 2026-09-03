import React, { useState } from 'react';
import { BarChart3, Leaf, Compass, Award } from 'lucide-react';

export default function BuyerStatsView() {
  const [stats] = useState({
    totalWeight: 148.5, // en kg
    bioWeight: 38.0,    // en kg (soit 25.5%)
    sustainableWeight: 82.5, // en kg (soit 55.5% d'EGAlim éligible)
    avgDistanceKm: 14.2,
    carbonSavedKg: 185.6 // kg de CO2 économisés par rapport au transport longue distance
  });

  const bioPercent = (stats.bioWeight / stats.totalWeight) * 100;
  const sustainablePercent = (stats.sustainableWeight / stats.totalWeight) * 100;

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <BarChart3 className="mr-2 text-brand-gold" size={20} />
          Indicateurs d'Achat & Ratios EGAlim
        </h3>
        <p className="text-xs text-gray-500 mt-1">Pilotez votre conformité avec la loi EGAlim pour la restauration collective.</p>
      </div>

      {/* Ratios Graphiques EGAlim */}
      <div className="space-y-4">
        {/* Barre 1 : Part de Bio */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-700 flex items-center"><Leaf size={14} className="mr-1.5 text-emerald-600" /> Approvisionnement Biologique</span>
            <span className="text-brand-green">{bioPercent.toFixed(1)}% <span className="text-[10px] text-gray-400">(Cible : 20%)</span></span>
          </div>
          <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden">
            <div
              className="bg-brand-green h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(bioPercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-brand-green font-medium">✓ Votre quota légal de 20% de produits certifiés Agriculture Biologique est respecté.</p>
        </div>

        {/* Barre 2 : Part de Produits Qualité & Durables */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-700 flex items-center"><Award size={14} className="mr-1.5 text-brand-gold" /> Produits Éligibles EGAlim (Durables/Qualité)</span>
            <span className="text-brand-gold">{sustainablePercent.toFixed(1)}% <span className="text-[10px] text-gray-400">(Cible : 50%)</span></span>
          </div>
          <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden">
            <div
              className="bg-brand-gold h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(sustainablePercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-brand-gold font-medium">✓ Félicitations ! Vos approvisionnements durables (filière courte, labels de qualité) dépassent les 50% requis.</p>
        </div>
      </div>

      {/* Cartes Bilan Environnemental */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
        <div className="p-4 bg-gray-50 rounded-xl flex items-start space-x-3 text-xs">
          <Compass className="text-brand-green flex-shrink-0" size={18} />
          <div>
            <p className="font-bold text-brand-dark">Distance d'approvisionnement moyenne</p>
            <p className="text-2xl font-extrabold text-brand-green mt-1">{stats.avgDistanceKm} km</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ultra-proximité (bassin agricole toulousain).</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl flex items-start space-x-3 text-xs">
          <Leaf className="text-emerald-600 flex-shrink-0" size={18} />
          <div>
            <p className="font-bold text-brand-dark">Émissions CO₂ Évitées</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">-{stats.carbonSavedKg} kg</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Économie calculée par rapport à un circuit logistique long.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { Calculator, Navigation, Clock, Fuel, RefreshCw, X, CheckCircle2, Zap } from "lucide-react";

/**
 * 📏 Formule géodésique de Haversine pour le calcul de distance routière
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 10.0;
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDist = R * c;
  return Math.round(directDist * 1.3 * 10) / 10; // Facteur 1.3 pour intégrer le réseau routier
}

/**
 * ⏱️ Estimation du temps de trajet en minutes
 */
export function estimateTravelTimeMinutes(distanceKm, avgSpeedKmH = 45) {
  if (!distanceKm || distanceKm <= 0) return 10;
  const hours = distanceKm / avgSpeedKmH;
  return Math.round(hours * 60);
}

/**
 * ⛽ Estimation des métriques de carburant et CO2
 */
export function estimateRouteMetrics(totalKm, fuelConsL100 = 8.5, fuelPriceEur = 1.85, co2gPerKm = 150) {
  const km = Number(totalKm || 0);
  const liters = (km * fuelConsL100) / 100;
  const fuelCostEur = Math.round(liters * fuelPriceEur * 100) / 100;
  const co2Kg = Math.round(((km * co2gPerKm) / 1000) * 10) / 10;

  return {
    liters: Math.round(liters * 10) / 10,
    fuelCostEur,
    co2Kg,
  };
}

/**
 * ⚡ Algorithme d'optimisation du plus proche voisin (Nearest Neighbor)
 */
export function optimizeStopsSequence(stops) {
  if (!Array.isArray(stops) || stops.length <= 1) return stops;
  const copy = [...stops];
  const reordered = [copy.shift()];

  while (copy.length > 0) {
    const last = reordered[reordered.length - 1];
    let closestIdx = 0;
    let minDistance = Infinity;

    copy.forEach((candidate, idx) => {
      const dist = calculateHaversineDistance(
        last.lat || 43.604,
        last.lng || 1.444,
        candidate.lat || 43.604 + idx * 0.02,
        candidate.lng || 1.444 + idx * 0.02
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    const [nextStop] = copy.splice(closestIdx, 1);
    nextStop.distanceFromPrevKm = minDistance;
    reordered.push(nextStop);
  }

  return reordered;
}

/**
 * 🗺️ COMPOSANT AUTONOME : RouteCalculatorModal.jsx
 * Outil interactif de calcul et d'optimisation de tournée (Distance, Temps, Carburant, CO2, Ordre d'Escale).
 */
export default function RouteCalculatorModal({
  isOpen,
  onClose,
  stops = [],
  type = "pickups",
  selectedDate,
  onApplyOptimizedOrder,
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [orderedStops, setOrderedStops] = useState(stops);

  useEffect(() => {
    setOrderedStops(stops);
  }, [stops]);

  // Calcul des métriques globales de la tournée
  const metrics = useMemo(() => {
    let totalKm = 0;
    let totalTimeMin = 0;

    orderedStops.forEach((stop, idx) => {
      const stepKm = stop.distanceFromPrevKm ?? (idx === 0 ? 8.5 : 12.3);
      const stepMin = stop.estimatedMinutesFromPrev ?? estimateTravelTimeMinutes(stepKm);
      totalKm += stepKm;
      totalTimeMin += stepMin + 15; // 15 min de temps de manutention par escale
    });

    const routeMetrics = estimateRouteMetrics(totalKm);
    const hours = Math.floor(totalTimeMin / 60);
    const mins = totalTimeMin % 60;

    return {
      totalKm: Math.round(totalKm * 10) / 10,
      totalTimeFormatted: `${hours}h ${mins}min`,
      fuelCostEur: routeMetrics.fuelCostEur,
      co2Kg: routeMetrics.co2Kg,
    };
  }, [orderedStops]);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const optimized = optimizeStopsSequence(stops);
      setOrderedStops(optimized);
      setIsOptimizing(false);
    }, 500);
  };

  const handleApply = () => {
    if (onApplyOptimizedOrder) {
      onApplyOptimizedOrder(orderedStops);
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const isPickup = type === "pickups";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in text-slate-800 text-xs font-sans">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4">
        {/* En-tête de l'outil */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isPickup ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                Calculateur & Optimiseur de Tournée {isPickup ? "de Collecte" : "de Livraison"}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Suivi pour la date de livraison souhaitée du <strong className="text-slate-800">{selectedDate || "Jour"}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grille des indicateurs calculés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
              <Navigation size={11} className="text-emerald-700" /> Dist. Totale
            </span>
            <span className="text-sm font-black font-mono text-slate-900">{metrics.totalKm} km</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
              <Clock size={11} className="text-emerald-700" /> Temps Estimé
            </span>
            <span className="text-sm font-black font-mono text-slate-900">{metrics.totalTimeFormatted}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
              <Fuel size={11} className="text-amber-700" /> Carburant
            </span>
            <span className="text-sm font-black font-mono text-slate-900">{metrics.fuelCostEur} €</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
              <Zap size={11} className="text-emerald-700" /> Impact CO2
            </span>
            <span className="text-sm font-black font-mono text-slate-900">{metrics.co2Kg} kg</span>
          </div>
        </div>

        {/* Action d'optimisation d'itinéraire */}
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1">
              <Zap size={14} className="text-emerald-700" />
              <span>Optimisation par l'algorithme du Plus Proche Voisin</span>
            </span>
            <p className="text-[10px] text-emerald-800">
              Reclasse les escales pour minimiser le kilométrage et économiser le carburant.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            {isOptimizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Calculer l'Itinéraire Optimal</span>
          </button>
        </div>

        {/* Ordre des escales de la tournée */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
            Séquence des Escales ({orderedStops.length} arrêt(s))
          </span>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[220px] overflow-y-auto">
            {orderedStops.map((stop, idx) => {
              const name = stop.producerName || stop.buyerName || `Escale ${idx + 1}`;
              const address = stop.producerAddress || stop.deliveryAddress || "Adresse locale";
              const stepKm = stop.distanceFromPrevKm ?? (idx === 0 ? 8.5 : 12.3);

              return (
                <div key={stop.id || stop.producerId || stop.parentOrderId || idx} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center font-mono border border-slate-200">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs">{name}</h5>
                      <span className="text-[10px] text-slate-400 font-medium block truncate max-w-xs">{address}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] font-bold text-emerald-800">
                    <span>+{stepKm} km</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 size={14} />
            <span>Appliquer cet Ordre de Tournée</span>
          </button>
        </div>
      </div>
    </div>
  );
}

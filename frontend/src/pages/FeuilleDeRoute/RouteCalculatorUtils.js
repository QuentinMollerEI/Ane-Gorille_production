/**
 * 🚚 UTILITAIRE : RouteCalculatorUtils.js
 * Outil de calcul d'itinéraire, d'estimation kilométrique, de temps de trajet et d'optimisation de tournée (TSP/Plus Proche Voisin).
 */

// Formule de Haversine pour calculer la distance à vol d'oiseau entre deux coordonnées GPS
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
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
  const distance = R * c;
  return Math.round(distance * 1.25 * 10) / 10; // Facteur de détour routier ~1.25
}

// Estimation du temps de trajet en minutes en fonction de la distance et d'une vitesse moyenne (45 km/h en périurbain)
export function estimateTravelTimeMinutes(distanceKm, averageSpeedKmH = 45) {
  if (!distanceKm || distanceKm <= 0) return 5;
  const hours = distanceKm / averageSpeedKmH;
  return Math.round(hours * 60);
}

// Estimation des coûts de carburant et émissions CO2
export function estimateRouteMetrics(totalDistanceKm, avgFuelConsL100 = 8.5, fuelPricePerL = 1.85) {
  const fuelLiters = (totalDistanceKm * avgFuelConsL100) / 100;
  const fuelCostEur = Math.round(fuelLiters * fuelPricePerL * 100) / 100;
  const co2Kg = Math.round(fuelLiters * 2.65 * 10) / 10; // 2.65 kg CO2 / L gazole
  return { fuelLiters: Math.round(fuelLiters * 10) / 10, fuelCostEur, co2Kg };
}

// Algorithme d'optimisation de tournée (Plus Proche Voisin)
export function optimizeStopsSequence(stops = [], hubCoords = { lat: 48.8566, lon: 2.3522 }) {
  if (!stops || stops.length <= 1) return stops;

  const unvisited = [...stops];
  const optimized = [];
  let currentPos = { lat: hubCoords.lat, lon: hubCoords.lon };

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    unvisited.forEach((stop, idx) => {
      // Coordonnées fictives ou extraites de l'adresse si non renseignées
      const stopLat = stop.lat || hubCoords.lat + (Math.hash ? Math.hash(stop.id || idx) % 100 / 500 : (idx * 0.05));
      const stopLon = stop.lon || hubCoords.lon + (Math.hash ? Math.hash(stop.id || idx) % 100 / 500 : (idx * 0.05));

      const dist = calculateHaversineDistance(currentPos.lat, currentPos.lon, stopLat, stopLon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = idx;
      }
    });

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    optimized.push({
      ...nextStop,
      distanceFromPrevKm: minDistance,
      estimatedMinutesFromPrev: estimateTravelTimeMinutes(minDistance),
    });

    currentPos = {
      lat: nextStop.lat || currentPos.lat + 0.02,
      lon: nextStop.lon || currentPos.lon + 0.02,
    };
  }

  return optimized;
}

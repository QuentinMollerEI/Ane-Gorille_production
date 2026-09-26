import { CENTRAL_LAT, CENTRAL_LON } from "../constants.js";

export function calculateDistanceKm(lat1, lon1, lat2 = CENTRAL_LAT, lon2 = CENTRAL_LON) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function isValidLuhnSiret(siret) {
  const clean = (siret || "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(clean.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
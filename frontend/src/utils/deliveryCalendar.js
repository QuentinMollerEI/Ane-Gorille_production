/**
 * 🗓️ MOTEUR CALENDAIRE LOGISTIQUE — Âne & Gorille
 * 
 * Règles métiers :
 * - Cut-off à 12h00 pour la préparation maraîchère.
 * - Lundi (1), Mardi (2), Mercredi (3) : Avant 12h -> J+1 | Après 12h -> J+2
 * - Jeudi (4) : J+1 (Vendredi)
 * - Vendredi (5) : J+3 (Lundi)
 * - Samedi (6) : J+3 (Mardi)
 * - Dimanche (0) : J+2 (Mardi)
 * - Exclusion stricte des livraisons les Samedis et Dimanches.
 */

/**
 * Calcule la fenêtre de dates disponibles sur 11 jours ouvrés.
 * @param {Date} orderDate - Date de la commande
 * @returns {Object} { availableDates: Date[] }
 */
export function calculateDeliveryWindow(orderDate = new Date()) {
  const hour = orderDate.getHours();
  const day = orderDate.getDay(); // 0: Dimanche, 1: Lundi, ..., 6: Samedi

  let leadDaysMin = 1;

  // Lundi (1), Mardi (2), Mercredi (3)
  if ([1, 2, 3].includes(day)) {
    leadDaysMin = hour < 12 ? 1 : 2;
  } else if (day === 4) {
    // Jeudi -> Vendredi
    leadDaysMin = 1;
  } else if (day === 5) {
    // Vendredi -> Lundi
    leadDaysMin = 3;
  } else if (day === 6) {
    // Samedi -> Mardi
    leadDaysMin = 3;
  } else if (day === 0) {
    // Dimanche -> Mardi
    leadDaysMin = 2;
  }

  // 1. Date minimale de livraison
  const minDate = new Date(orderDate);
  minDate.setDate(minDate.getDate() + leadDaysMin);
  minDate.setHours(0, 0, 0, 0);

  // Sécurité anti-weekend
  if (minDate.getDay() === 6) minDate.setDate(minDate.getDate() + 2); // Samedi -> Lundi
  if (minDate.getDay() === 0) minDate.setDate(minDate.getDate() + 1); // Dimanche -> Lundi

  // 2. Date maximale de livraison (~11 jours ouvrés)
  const maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + 15);
  maxDate.setHours(23, 59, 59, 999);

  // 3. Filtrage des dates valides (hors week-ends)
  const availableDates = [];
  let currentDate = new Date(minDate);

  while (currentDate <= maxDate && availableDates.length < 11) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      availableDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { availableDates };
}

/**
 * Renvoie la première date de livraison calculée au format ISO (YYYY-MM-DD).
 * @param {Date} orderDate 
 * @returns {string} Date au format YYYY-MM-DD
 */
export function getCalculatedDeliveryDate(orderDate = new Date()) {
  const { availableDates } = calculateDeliveryWindow(orderDate);
  if (availableDates && availableDates.length > 0) {
    return availableDates[0].toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Formate une date au format ISO YYYY-MM-DD (ex: "2026-09-25").
 * @param {Date|string} date 
 * @returns {string} Date au format YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date = new Date()) {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

/**
 * Formate une date en chaîne lisible en français.
 * @param {Date|string} date 
 * @returns {string} Exemple : "Lundi 28 Septembre"
 */
export function formatFrenchDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const formatted = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default {
  calculateDeliveryWindow,
  getCalculatedDeliveryDate,
  formatDateToYYYYMMDD,
  formatFrenchDate
};

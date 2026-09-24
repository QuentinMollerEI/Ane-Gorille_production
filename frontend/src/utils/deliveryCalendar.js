/**
 * 📅 UTILITAIRE : deliveryCalendar.js
 * Emplacement : frontend/src/utils/deliveryCalendar.js
 * 
 * RÈGLES MÉTIERS LOGISTIQUES ÂNE & GORILLE :
 * 1. Jours fermés (Aucune collecte ni livraison) : Jeudi (4), Samedi (6), Dimanche (0).
 * 2. Jours ouverts : Lundi (1), Mardi (2), Mercredi (3), Vendredi (5).
 * 3. Cut-off à 12h00 pour la préparation maraîchère.
 * 4. Plage d'ouverture : 11 jours livrables autorisés à compter de la commande.
 */

// Jours ouverts : 1 = Lundi, 2 = Mardi, 3 = Mercredi, 5 = Vendredi
const OPEN_DAYS = [1, 2, 3, 5];

/**
 * Calcule la liste des 11 prochaines dates de livraison autorisées.
 * @param {Date} orderDate Date et heure de validation de la commande (par défaut : Date courante)
 * @returns {Object} { availableDates: Date[], minDate: Date, maxDate: Date }
 */
export function calculateDeliveryWindow(orderDate = new Date()) {
  const current = new Date(orderDate);
  const hour = current.getHours();

  // Règle du Cut-off à 12h00 :
  // Avant 12h00 -> Premier délai possible à J+1
  // Après 12h00 (ou égal) -> Premier délai possible à J+2
  const leadDaysMin = hour < 12 ? 1 : 2;

  const availableDates = [];
  const checkDate = new Date(current);
  checkDate.setHours(0, 0, 0, 0);
  
  // Avancer du nombre de jours de délai minimum
  checkDate.setDate(checkDate.getDate() + leadDaysMin);

  // Boucle de recherche des 11 jours livrables autorisés
  while (availableDates.length < 11) {
    const dayOfWeek = checkDate.getDay(); // 0: Dimanche, 1: Lundi, ..., 6: Samedi
    
    // On vérifie si c'est un jour ouvert (Lundi, Mardi, Mercredi, Vendredi)
    if (OPEN_DAYS.includes(dayOfWeek)) {
      availableDates.push(new Date(checkDate));
    }
    
    // Passer au jour suivant
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return {
    availableDates,
    minDate: availableDates[0] || null,
    maxDate: availableDates[availableDates.length - 1] || null
  };
}

/**
 * Retourne la première date disponible au format YYYY-MM-DD.
 */
export function getCalculatedDeliveryDate(orderDate = new Date()) {
  const { availableDates } = calculateDeliveryWindow(orderDate);
  if (availableDates.length > 0) {
    return availableDates[0].toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Formate une date en YYYY-MM-DD.
 */
export function formatDateToYYYYMMDD(dateObj) {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Formate une date en français lisible (ex: "Vendredi 25 septembre 2026").
 * @param {Date|string|number} dateInput 
 * @param {Object} options Options de formatage (optionnel)
 * @returns {string}
 */
export function formatFrenchDate(dateInput, options = {}) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const defaultOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options
  };

  try {
    const formatted = d.toLocaleDateString("fr-FR", defaultOptions);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (err) {
    return d.toISOString().split("T")[0];
  }
}

export default {
  calculateDeliveryWindow,
  getCalculatedDeliveryDate,
  formatDateToYYYYMMDD,
  formatFrenchDate
};
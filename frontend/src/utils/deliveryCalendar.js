/**
 * 🌾 CALCULATEUR LOGISTIQUE ÂNE & GORILLE
 * Calcul dynamique de la date minimale de livraison (EADD)
 * et génération de la liste des 11 jours livrables disponibles.
 * 
 * Règles logistiques :
 * - Jours de collecte/livraison autorisés : Lundi (1), Mardi (2), Mercredi (3), Vendredi (5).
 * - Jours de fermeture opérationnelle : Jeudi (4), Samedi (6), Dimanche (0).
 * - Cutoff : 12h00 (Midi).
 */

export function getEarliestDeliveryDate(orderDate = new Date()) {
  const date = new Date(orderDate);
  const hour = date.getHours();
  const day = date.getDay(); // 0: Dimanche, 1: Lundi, ..., 6: Samedi

  let deliveryDate = new Date(date);

  if (day === 1) { // LUNDI
    deliveryDate.setDate(date.getDate() + (hour < 12 ? 1 : 2)); // Mar (J+1) ou Mer (J+2)
  } else if (day === 2) { // MARDI
    deliveryDate.setDate(date.getDate() + (hour < 12 ? 1 : 3)); // Mer (J+1) ou Ven (J+3)
  } else if (day === 3) { // MERCREDI
    deliveryDate.setDate(date.getDate() + (hour < 12 ? 2 : 5)); // Ven (J+2) ou Lun (J+5)
  } else if (day === 4) { // JEUDI (Fermé)
    deliveryDate.setDate(date.getDate() + 4); // Lun (J+4)
  } else if (day === 5) { // VENDREDI
    deliveryDate.setDate(date.getDate() + (hour < 12 ? 3 : 4)); // Lun (J+3) ou Mar (J+4)
  } else if (day === 6) { // SAMEDI (Fermé)
    deliveryDate.setDate(date.getDate() + 3); // Mar (J+3)
  } else if (day === 0) { // DIMANCHE (Fermé)
    deliveryDate.setDate(date.getDate() + 2); // Mar (J+2)
  }

  deliveryDate.setHours(0, 0, 0, 0);
  return deliveryDate;
}

export function getAvailableDeliveryDates(orderDate = new Date(), maxDeliverableDays = 11) {
  const minDate = getEarliestDeliveryDate(orderDate);
  const availableDates = [];

  let currentDate = new Date(minDate);

  while (availableDates.length < maxDeliverableDays) {
    const dayOfWeek = currentDate.getDay();
    // On conserve uniquement Lundi(1), Mardi(2), Mercredi(3) et Vendredi(5)
    if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 5) {
      availableDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDates;
}

export function calculateDeliveryWindow(orderDate = new Date()) {
  return {
    availableDates: getAvailableDeliveryDates(orderDate, 11),
  };
}

export default {
  getEarliestDeliveryDate,
  getAvailableDeliveryDates,
  calculateDeliveryWindow
};

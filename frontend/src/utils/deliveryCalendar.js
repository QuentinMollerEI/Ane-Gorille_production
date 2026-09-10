/**
 * Calcule la plage de dates de livraison autorisées
 * @param {Date} orderDate Date de la commande (défaut : maintenant)
 * @returns { object } { minDate, maxDate, availableDates: Date[] }
 */
export function calculateDeliveryWindow(orderDate = new Date()) {
  const dayOfWeek = orderDate.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi
  let daysToMinDelivery = 1;

  if (dayOfWeek === 5) {
    // Vendredi -> Livraison possible à partir de Lundi (J+3)
    daysToMinDelivery = 3;
  } else if (dayOfWeek === 6) {
    // Samedi -> Livraison possible Lundi (J+2)
    daysToMinDelivery = 2;
  } else if (dayOfWeek === 0) {
    // Dimanche -> Livraison possible Lundi (J+1)
    daysToMinDelivery = 1;
  } else {
    // Lundi à Jeudi -> J+1
    daysToMinDelivery = 1;
  }

  const minDate = new Date(orderDate);
  minDate.setDate(minDate.getDate() + daysToMinDelivery);
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(orderDate);
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(23, 59, 59, 999);

  // Génération du tableau des dates valides (hors Dimanches)
  const availableDates = [];
  let currentDate = new Date(minDate);

  while (currentDate <= maxDate) {
    // Exclure les dimanches (0) si le hub est fermé
    if (currentDate.getDay() !== 0) {
      availableDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    minDate,
    maxDate,
    availableDates,
    defaultSlot: "MATIN", // Créneau imposé pour les livraisons acheteurs
  };
}

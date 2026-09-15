export function calculateDeliveryWindow(orderDate = new Date()) {
  const hour = orderDate.getHours();
  const day = orderDate.getDay(); // 0: Dimanche, 1: Lundi, ..., 6: Samedi

  let leadDaysMin = 1;

  if ([1-3].includes(day)) {
    // Lundi, Mardi, Mercredi : Avant 12h -> J+1, Après 12h -> J+2
    leadDaysMin = hour < 12 ? 1 : 2;
  } else if (day === 4) {
    // Jeudi : J+1 (Vendredi)
    leadDaysMin = 1;
  } else if (day === 5) {
    // Vendredi : J+3 (Lundi)
    leadDaysMin = 3;
  } else if (day === 6) {
    // Samedi : J+3 (Mardi)
    leadDaysMin = 3;
  } else if (day === 0) {
    // Dimanche : J+2 (Mardi)
    leadDaysMin = 2;
  }

  // 1. Définition de la date minimum de livraison
  const minDate = new Date(orderDate);
  minDate.setDate(minDate.getDate() + leadDaysMin);
  minDate.setHours(0, 0, 0, 0);

  // Sécurité anti-weekend : Si la date min tombe un samedi ou dimanche, on repousse au lundi
  if (minDate.getDay() === 6) minDate.setDate(minDate.getDate() + 2);
  if (minDate.getDay() === 0) minDate.setDate(minDate.getDate() + 1);

  // 2. Définition de la date maximum (J+7)
  const maxDate = new Date(orderDate);
  maxDate.setDate(maxDate.getDate() + 7);
  maxDate.setHours(23, 59, 59, 999);

  // 3. Génération des dates disponibles (exclusion du samedi et dimanche)
  const availableDates = [];
  let currentDate = new Date(minDate);

  while (currentDate <= maxDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      availableDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    availableDates,
  };
}
/**
 * 📅 UTILITAIRE : deliveryCalendar.js
 * RÈGLES MÉTIERS LOGISTIQUES ÂNE & GORILLE :
 * 1. Jours fermés (Aucune collecte ni livraison) : Jeudi (4), Samedi (6), Dimanche (0).
 * 2. Jours ouverts : Lundi (1), Mardi (2), Mercredi (3), Vendredi (5).
 * 3. Cut-off à 12h00 pour la préparation maraîchère.
 * 4. Plage d'ouverture : 11 jours livrables autorisés à compter de la commande.
 */

/**
 * Formate un objet Date local en chaîne YYYY-MM-DD neutre vis-à-vis des fuseaux horaires (sans conversion UTC).
 */
export function formatDateToYYYYMMDD(d = new Date()) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formate une chaîne YYYY-MM-DD en date française littérale (ex: "Mardi 22 septembre 2026").
 */
export function formatFrenchDate(dateStr) {
  if (!dateStr || dateStr === 'Non spécifiée' || dateStr === 'Date en attente' || dateStr === 'ALL') {
    return 'Non spécifiée';
  }
  const str = String(dateStr).trim();
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0); // Midi heure locale
      if (!isNaN(dateObj.getTime())) {
        const formatted = dateObj.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
    }
  }
  return str;
}

/**
 * Calcule la fenêtre de livraison (11 jours livrables à compter de l'heure du jour).
 */
export function calculateDeliveryWindow(orderDate = new Date()) {
  const dateObj = orderDate instanceof Date ? orderDate : new Date(orderDate);
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  
  const hour = validDate.getHours();
  const day = validDate.getDay();

  let leadDaysMin = 1;

  if ([1, 2, 3].includes(day)) {
    leadDaysMin = hour < 12 ? 1 : 2;
  } else if (day === 4) {
    leadDaysMin = 1;
  } else if (day === 5) {
    leadDaysMin = hour < 12 ? 3 : 4;
  } else if (day === 6) {
    leadDaysMin = 3;
  } else if (day === 0) {
    leadDaysMin = 2;
  }

  const minDate = new Date(validDate);
  minDate.setDate(minDate.getDate() + leadDaysMin);
  minDate.setHours(0, 0, 0, 0);

  while ([0, 4, 6].includes(minDate.getDay())) {
    minDate.setDate(minDate.getDate() + 1);
  }

  const availableDates = [];
  let currentDate = new Date(minDate);

  while (availableDates.length < 11) {
    if (![0, 4, 6].includes(currentDate.getDay())) {
      availableDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const firstAvailable = availableDates.length > 0 ? availableDates[0] : minDate;

  return {
    minDate,
    availableDates,
    firstAvailableDateStr: formatDateToYYYYMMDD(firstAvailable)
  };
}

export function getCalculatedDeliveryDate(createdAtDate) {
  const windowData = calculateDeliveryWindow(createdAtDate);
  return windowData.firstAvailableDateStr;
}

export function isWeekend(dateStr) {
  if (!dateStr || dateStr === 'ALL') return false;
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    if (!isNaN(dateObj.getTime())) {
      const day = dateObj.getDay();
      return day === 0 || day === 4 || day === 6;
    }
  }
  return false;
}

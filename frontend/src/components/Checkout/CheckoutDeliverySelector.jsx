import React, { useState, useEffect } from "react";
import { Truck, Calendar, Info } from "lucide-react";
import { getAvailableDeliveryDates } from "../../utils/deliveryCalendar";

/**
 * 🌾 COMPOSANT : CheckoutDeliverySelector.jsx
 * Sélecteur de date de livraison B2B/B2G avec un paragraphe d'information synthétique.
 * 
 * - Jours de livraison : Lundi, Mardi, Mercredi, Vendredi (06h00 - 09h00).
 * - Coupure à 12h00 : Commande avant 12h = récolte l'après-midi même.
 * - Fermeture : Jeudi, Samedi et Dimanche.
 */
export default function CheckoutDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "06:00 - 09:00 (Matinée)",
    instructions: ""
  });

  // Initialisation et calcul sécurisé des dates livrables
  useEffect(() => {
    let dates = [];
    try {
      if (typeof getAvailableDeliveryDates === "function") {
        dates = getAvailableDeliveryDates(new Date(), 11);
      }
    } catch (e) {
      console.warn("Utilisation du mode de secours pour le calendrier de livraison :", e);
    }

    // Fallback de secours si getAvailableDeliveryDates n'est pas disponible
    if (!dates || dates.length === 0) {
      const now = new Date();
      let current = new Date(now);
      current.setDate(current.getDate() + (now.getHours() < 12 ? 1 : 2));
      
      while (dates.length < 11) {
        const d = current.getDay();
        // Lundi (1), Mardi (2), Mercredi (3), Vendredi (5)
        if (d === 1 || d === 2 || d === 3 || d === 5) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
    }

    setAvailableDates(dates);

    if (dates && dates.length > 0) {
      const defaultDate = dates[0].toISOString().slice(0, 10);
      const initialDetails = {
        selectedDate: defaultDate,
        deliveryWindow: "06:00 - 09:00 (Matinée)",
        instructions: ""
      };
      setDeliveryDetails(initialDetails);

      // Notification différée au composant parent (CheckoutForm) sans bloquer le cycle de rendu
      if (onDeliveryChange) {
        queueMicrotask(() => {
          onDeliveryChange(initialDetails);
        });
      }
    }
  }, []);

  const handleUpdate = (updates) => {
    const nextState = { ...deliveryDetails, ...updates };
    setDeliveryDetails(nextState);
    if (onDeliveryChange) onDeliveryChange(nextState);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
      {/* BANNIÈRE D'INFORMATION SYNTHÉTIQUE EN UN SEUL PARAGRAPHE */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2 text-emerald-950">
        <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2">
          <Truck className="text-emerald-700 shrink-0" size={18} />
          <h4 className="font-black text-sm text-emerald-900">
            Récolte & Planning de Livraison
          </h4>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          Commandez avant <strong className="text-emerald-950 font-black">12h00 (Midi)</strong> pour une récolte au champ l'après-midi même et une livraison le prochain jour travaillé (<strong className="text-emerald-900 font-extrabold">Lundi, Mardi, Mercredi ou Vendredi</strong> entre <strong className="text-emerald-900 font-extrabold">06h00 et 09h00</strong>). Aucune collecte ni livraison le Jeudi, Samedi et Dimanche.
        </p>
      </div>

      {/* SÉLECTEUR DE DATE DE LIVRAISON SOUHAITÉE */}
      <div className="space-y-3 pt-1">
        <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-2 border-b border-gray-200 pb-2">
          <Calendar className="text-emerald-700" size={16} />
          <span>Sélection de votre date de réception</span>
        </h3>

        {/* Menu déroulant unique pour la date de livraison */}
        <div className="space-y-1.5">
          <label className="font-bold text-gray-700 text-[11px] flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-700" />
              Date de livraison souhaitée *
            </span>
            <span className="text-[10px] text-emerald-800 font-extrabold lowercase font-mono">
              (Livraison de 06h00 à 09h00)
            </span>
          </label>
          <select
            required
            value={deliveryDetails.selectedDate}
            onChange={(e) => handleUpdate({ selectedDate: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl bg-white text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
          >
            <option value="" disabled>Choisir une date de livraison</option>
            {availableDates.map((date, idx) => {
              const dateStr = date.toISOString().slice(0, 10);
              const formatted = date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              });
              return (
                <option key={idx} value={dateStr}>
                  {formatted.charAt(0).toUpperCase() + formatted.slice(1)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Consignes pour le livreur */}
        <div className="space-y-1.5 pt-1">
          <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
            <Info size={12} className="text-emerald-700" /> Consignes Livreur (Optionnel)
          </label>
          <input
            type="text"
            maxLength={150}
            placeholder="Ex: Code portail 1234, quai de déchargement en cuisine..."
            value={deliveryDetails.instructions}
            onChange={(e) => handleUpdate({ instructions: e.target.value })}
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

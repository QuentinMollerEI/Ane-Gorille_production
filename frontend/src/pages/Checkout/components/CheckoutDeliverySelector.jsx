import React, { useState, useEffect } from "react";
import { calculateDeliveryWindow, formatDateToYYYYMMDD, formatFrenchDate } from "../../utils/deliveryCalendar.js";
import { Truck, Calendar, Info, ShieldCheck } from "lucide-react";

/**
 * 🚚 COMPOSANT : CheckoutDeliverySelector.jsx
 * Sélecteur de date de livraison pour le panier / checkout.
 * Propose 11 dates livrables suivant la date du jour et l'heure (hors Jeudis, Samedis et Dimanches).
 */
export default function CheckoutDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin (06h00 - 08h00)",
    instructions: ""
  });

  useEffect(() => {
    // Calcul automatique des 11 jours livrables selon la date et l'heure courante
    const windowData = calculateDeliveryWindow(new Date());
    setAvailableDates(windowData.availableDates);
    
    if (windowData.availableDates.length > 0) {
      const defaultDateStr = formatDateToYYYYMMDD(windowData.availableDates[0]);
      const initialDetails = {
        selectedDate: defaultDateStr,
        deliveryWindow: "Matin (06h00 - 08h00)",
        instructions: ""
      };
      setDeliveryDetails(initialDetails);
      sessionStorage.setItem("selectedDeliveryDate", defaultDateStr);
      if (onDeliveryChange) {
        onDeliveryChange(initialDetails);
      }
    }
  }, []);

  const handleUpdate = (updates) => {
    setDeliveryDetails(prev => {
      const nextState = { ...prev, ...updates };
      if (nextState.selectedDate) {
        sessionStorage.setItem("selectedDeliveryDate", nextState.selectedDate);
      }
      if (onDeliveryChange) {
        onDeliveryChange(nextState);
      }
      return nextState;
    });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3.5 shadow-sm text-xs font-sans text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider">
          <Truck className="text-emerald-700" size={16} /> 
          <span>Planification de la Livraison</span>
        </h3>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-mono">
          <ShieldCheck size={12} />
          <span>Livraison le Matin uniquement</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar size={13} className="text-emerald-700" /> Date de Livraison Souhaitée *
        </label>
        <select 
          required 
          value={deliveryDetails.selectedDate} 
          onChange={(e) => handleUpdate({ selectedDate: e.target.value })} 
          className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="" disabled>Choisir une date de livraison...</option>
          {availableDates.map((dateObj, idx) => {
            const dateStr = formatDateToYYYYMMDD(dateObj);
            const formattedDisplay = formatFrenchDate(dateStr);
            return (
              <option key={idx} value={dateStr}>
                {formattedDisplay} ({dateStr.split('-').reverse().join('/')})
              </option>
            );
          })}
        </select>
        <p className="text-[10px] text-slate-500 font-medium italic mt-1">
          * Aucune collecte ni livraison les jeudis, samedis et dimanches.
        </p>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Info size={13} className="text-emerald-700" /> Consignes pour le Livreur (Optionnel)
        </label>
        <input 
          type="text" 
          maxLength={150} 
          placeholder="Ex: Accès quai de déchargement, code portail 1234, appeler à l'arrivée..." 
          value={deliveryDetails.instructions} 
          onChange={(e) => handleUpdate({ instructions: e.target.value })} 
          className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500" 
        />
      </div>
    </div>
  );
}

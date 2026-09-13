import React, { useState, useEffect } from "react";
import { calculateDeliveryWindow } from "../../utils/deliveryCalendar";
import { Truck, Calendar, Info } from "lucide-react";

export default function CheckoutDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin", // Fixé en dur selon votre règle
    instructions: ""
  });

  useEffect(() => {
    // Calcul instantané en local selon vos règles de cut-off
    const windowData = calculateDeliveryWindow(new Date());
    setAvailableDates(windowData.availableDates);
    
    if (windowData.availableDates.length > 0) {
      handleUpdate({ selectedDate: windowData.availableDates[0].toISOString().slice(0, 10) });
    }
  }, []);

  const handleUpdate = (updates) => {
    const nextState = { ...deliveryDetails, ...updates };
    setDeliveryDetails(nextState);
    if (onDeliveryChange) onDeliveryChange(nextState);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
      <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-2 border-b border-gray-200 pb-2">
        <Truck className="text-emerald-700" size={16} /> 
        Planification Logistique
      </h3>

      <div className="space-y-1.5">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar size={12} className="text-emerald-700" /> Date de livraison souhaitée *
        </label>
        <select 
          required 
          value={deliveryDetails.selectedDate} 
          onChange={(e) => handleUpdate({ selectedDate: e.target.value })} 
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
        >
          <option value="" disabled>Choisir une date</option>
          {availableDates.map((date, idx) => (
            <option key={idx} value={date.toISOString().slice(0, 10)}>
              {date.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' })}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-1 font-semibold">Toutes nos livraisons s'effectuent exclusivement le matin.</p>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Info size={12} className="text-emerald-700" /> Consignes Livreur (Optionnel)
        </label>
        <input 
          type="text" 
          maxLength={150} 
          placeholder="Ex: Code portail 1234, accès par le quai arrière..." 
          value={deliveryDetails.instructions} 
          onChange={(e) => handleUpdate({ instructions: e.target.value })} 
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500" 
        />
      </div>
    </div>
  );
}
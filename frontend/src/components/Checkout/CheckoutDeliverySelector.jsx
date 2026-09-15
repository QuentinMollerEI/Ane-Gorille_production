import React, { useState, useEffect } from "react";
import { calculateDeliveryWindow } from "../../utils/deliveryCalendar";
import { Truck, Calendar, Info } from "lucide-react";

export default function CheckoutDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);

  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin",
    instructions: "",
  });

  useEffect(() => {
    const windowData = calculateDeliveryWindow(new Date());
    const datesArray = windowData.availableDates || [];
    setAvailableDates(datesArray);

    // ✅ CORRECTION DU TYPEERROR :
    // Vérification de la présence du tableau et accès explicite au premier élément 
    if (datesArray.length > 0 && datesArray instanceof Date) {
      const initialDateStr = datesArray.toISOString().slice(0, 10);
      handleUpdate({ selectedDate: initialDateStr });
    }
  }, []);

  const handleUpdate = (updates) => {
    const nextState = { ...deliveryDetails, ...updates };
    setDeliveryDetails(nextState);
    if (onDeliveryChange) onDeliveryChange(nextState);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
      <h3 className="font-black text-gray-900 text-xs flex items-center gap-2 border-b border-gray-200 pb-2">
        <Truck className="text-emerald-700" size={16} />
        <span>Planification de la Livraison</span>
      </h3>

      <div className="space-y-1.5">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar size={12} className="text-emerald-700" />
          <span>Date de livraison souhaitée *</span>
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
              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 font-semibold">
          Toutes nos livraisons s'effectuent exclusivement le matin.
        </p>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Info size={12} className="text-emerald-700" />
          <span>Consignes Livreur (Optionnel)</span>
        </label>
        <input
          type="text"
          maxLength={150}
          placeholder="Ex: Code portail 1234, quai de déchargement..."
          value={deliveryDetails.instructions}
          onChange={(e) => handleUpdate({ instructions: e.target.value })}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { calculateDeliveryWindow } from "../../utils/deliveryCalendar";
import { Truck, Calendar, Info, Clock } from "lucide-react";

export default function CheckoutDeliverySelector({ onDeliveryChange }) {
  const [availableDates, setAvailableDates] = useState([]);

  const [deliveryDetails, setDeliveryDetails] = useState({
    selectedDate: "",
    deliveryWindow: "Matin",
    instructions: ""
  });

  // 1. Initialisation des dates au montage du composant
  useEffect(() => {
    const windowData = calculateDeliveryWindow(new Date());
    const dates = windowData.availableDates || [];
    setAvailableDates(dates);

    if (dates.length > 0) {
      const firstDateString = dates[0].toISOString().slice(0, 10);
      setDeliveryDetails((prev) => ({
        ...prev,
        selectedDate: firstDateString
      }));
    }
  }, []);

  // 2. Notification sécurisée du composant parent (CheckoutForm) après le rendu
  useEffect(() => {
    if (deliveryDetails.selectedDate && typeof onDeliveryChange === "function") {
      onDeliveryChange(deliveryDetails);
    }
  }, [deliveryDetails, onDeliveryChange]);

  // 3. Gestionnaires d'événements pour les saisies utilisateur
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDeliveryDetails((prev) => ({ ...prev, selectedDate: newDate }));
  };

  const handleInstructionsChange = (e) => {
    const newInstructions = e.target.value;
    setDeliveryDetails((prev) => ({ ...prev, instructions: newInstructions }));
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
      <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-2 border-b border-gray-200 pb-2">
        <Truck className="text-emerald-700" size={16} />
        Planification Logistique
      </h3>

      {/* BANNIÈRE D'INFORMATION DE DÉLAI DE LIVRAISON */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-900 text-[11px]">
        <Clock size={15} className="text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Information Délais de Livraison :</p>
          <p className="text-emerald-800 font-medium mt-0.5">
            Commande passée <strong>avant 12h</strong> ➔ Livraison dès <strong>J+1</strong>.<br />
            Commande passée <strong>après 12h</strong> ➔ Livraison dès <strong>J+2</strong> (hors week-ends).
          </p>
        </div>
      </div>

      {/* SÉLECTEUR DE DATE */}
      <div className="space-y-1.5">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Calendar size={12} className="text-emerald-700" /> Date de livraison souhaitée *
        </label>
        <select
          required
          value={deliveryDetails.selectedDate}
          onChange={handleDateChange}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
        >
          <option value="" disabled>Choisir une date</option>
          {availableDates.map((date, idx) => (
            <option key={idx} value={date.toISOString().slice(0, 10)}>
              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-1 font-semibold">Toutes nos livraisons s'effectuent exclusivement le matin.</p>
      </div>

      {/* CONSIGNES LIVREUR */}
      <div className="space-y-1.5 pt-1">
        <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
          <Info size={12} className="text-emerald-700" /> Consignes Livreur (Optionnel)
        </label>
        <input
          type="text"
          maxLength={150}
          placeholder="Ex: Code portail 1234, accès par le quai arrière..."
          value={deliveryDetails.instructions}
          onChange={handleInstructionsChange}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
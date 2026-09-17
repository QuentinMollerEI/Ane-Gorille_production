import React, { useState, useEffect } from "react";
import { calculateDeliveryWindow } from "../../utils/deliveryCalendar";
import { Truck, Calendar, Info, Clock, AlertTriangle } from "lucide-react";

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

  // 2. Notification du composant parent (CheckoutForm)
  useEffect(() => {
    if (deliveryDetails.selectedDate && typeof onDeliveryChange === "function") {
      onDeliveryChange(deliveryDetails);
    }
  }, [deliveryDetails, onDeliveryChange]);

  // 3. Gestionnaires d'événements
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

      {/* 📦 INFORMATIONS DÉLAIS ET COLLECTES */}
      <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2.5 text-[11px] shadow-2xs">
        <div className="flex items-center gap-1.5 font-extrabold text-gray-900">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <span>Collectes l'après-midi & Heure de coupure (12h) :</span>
        </div>

        {/* GRILLE DÉLAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="font-black text-[9px] uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              Avant 12h
            </span>
            <span className="font-bold text-gray-700">
              Livraison dès <strong className="text-gray-900">J+1</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="font-black text-[9px] uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Après 12h
            </span>
            <span className="font-bold text-gray-700">
              Livraison dès <strong className="text-gray-900">J+2</strong>
            </span>
          </div>
        </div>

        {/* ⚠️ RÈGLE DU WEEK-END */}
        <div className="flex items-start gap-1.5 text-[10px] text-amber-900 font-medium bg-amber-50/80 border border-amber-200/80 p-2 rounded-xl">
          <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-black uppercase tracking-wider text-amber-950">Attention :</strong> Les commandes passées du <strong>vendredi après 12h jusqu'au dimanche</strong> sont collectées le lundi et livrées à partir du <strong>mardi matin</strong>.
          </span>
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
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
import React, { useState } from "react";
import { ClipboardCheck, ShieldAlert } from "lucide-react";

/**
 * 🥬 COMPOSANT : DeliveryItemsList.jsx
 * Responsabilité unique : Afficher la liste de pointage des légumes à livrer grouped par producteur.
 * Permet au livreur de cocher chaque article pour s'assurer de sa présence physique lors de la remise.
 */
export default function DeliveryItemsList({ subOrders }) {
  const [checkedItems, setCheckedItems] = useState({});

  const handleToggleCheck = (key) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-black uppercase tracking-wider">
        <ClipboardCheck size={14} className="text-gray-400" />
        <span>Pointage de conformité des colis (Recommandé) :</span>
      </div>

      <div className="space-y-4">
        {subOrders.map((sub) => (
          <div
            key={sub.id}
            className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-xs"
          >
            {/* Header Producteur Provenance */}
            <div className="bg-gray-50/80 px-4 py-2.5 border-b border-gray-150 flex justify-between items-center text-xs">
              <span className="font-extrabold text-gray-700 flex items-center gap-1">
                🧑‍🌾 {sub.producerName || "Producteur de proximité"}
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-bold">
                Bon N° {sub.subOrderId || sub.id.substring(0, 8)}
              </span>
            </div>

            {/* Liste des articles avec case à cocher pour pointage */}
            <div className="divide-y divide-gray-100 px-4">
              {sub.items?.map((item, idx) => {
                const itemKey = `${sub.id}-${idx}`;
                const isChecked = !!checkedItems[itemKey];

                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleCheck(itemKey)}
                    className={`py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/40 transition-colors select-none ${
                      isChecked ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Géré par le clic parent pour une meilleure accessibilité mobile
                        className="h-4.5 w-4.5 rounded-md text-green-700 border-gray-300 focus:ring-green-500 cursor-pointer"
                      />
                      <div>
                        <p
                          className={`text-xs font-black text-gray-800 ${isChecked ? "line-through" : ""}`}
                        >
                          {item.quantity || item.qty} {item.unit || "kg"} •{" "}
                          {item.title || item.name}
                        </p>
                        {sub.batchNumbers && sub.batchNumbers.length > 0 && (
                          <p className="text-[9px] text-amber-700 font-semibold font-mono mt-0.5">
                            HACCP Lot : {sub.batchNumbers.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {isChecked ? "Vérifié" : "À pointer"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

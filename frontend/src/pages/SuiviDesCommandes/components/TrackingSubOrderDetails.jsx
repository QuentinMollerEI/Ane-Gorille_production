import React from "react";
import { Building, Tag } from "lucide-react";

/**
 * 🧑‍🌾 COMPOSANT : TrackingSubOrderDetails.jsx
 * Affichage des sous-commandes maraîchères avec statuts et numéros de lots
 */
export default function TrackingSubOrderDetails({ associatedSubs = [] }) {
  return (
    <div className="space-y-3">
      {associatedSubs.map((sub) => {
        const items = sub.items || [];
        const isReady =
          sub.status === "PRET_A_EXPEDIER" ||
          sub.status === "EXPEDIE" ||
          sub.status === "LIVRE";

        return (
          <div
            key={sub.id}
            className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-2.5"
          >
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Building size={15} className="text-emerald-800" />
                <span className="font-black text-gray-900 text-xs">
                  {sub.producerName || "Exploitation Maraîchère"}
                </span>
              </div>

              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isReady
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {sub.status === "A_PREPARER"
                  ? "En récolte..."
                  : sub.status === "PRET_A_EXPEDIER"
                    ? "Prêt en "
                    : "Chargé / En route"}
              </span>
            </div>

            {/* LISTE DES ARTICLES DE CE MARAÎCHER */}
            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="font-extrabold text-gray-800">
                    • {item.title || item.name} (
                    {item.quantity || item.qty || 1} {item.unit || "kg"})
                  </span>
                  <span className="font-black text-emerald-800">
                    {Number(
                      (item.priceHT || item.price || 0) *
                        (item.quantity || item.qty || 1),
                    ).toFixed(2)}{" "}
                    € HT
                  </span>
                </div>
              ))}
            </div>

            {/* NUMÉROS DE LOTS HACCP */}
            {sub.batchNumbers && sub.batchNumbers.length > 0 && (
              <div className="pt-1.5 border-t border-gray-200/50 flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                <Tag size={12} className="text-emerald-700" />
                <span>
                  Lots HACCP :{" "}
                  <strong className="text-gray-700">
                    {sub.batchNumbers.join(", ")}
                  </strong>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

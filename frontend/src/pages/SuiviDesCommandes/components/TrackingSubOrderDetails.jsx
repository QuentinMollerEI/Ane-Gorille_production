import React from "react";

/**
 * 🧑‍🌾 COMPOSANT : TrackingSubOrderDetails.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/components/TrackingSubOrderDetails.jsx
 * Responsabilité unique : Affichage logistique des paniers par producteur,
 * avec indicateur de récolte indépendant et exposition des numéros de lots (HACCP) [cite: 10, 11].
 */
export default function TrackingSubOrderDetails({ associatedSubs }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
        État de préparation de vos colis par producteur :
      </h4>

      <div className="space-y-3.5">
        {associatedSubs.map((sub) => (
          <div
            key={sub.id}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <span>🧑‍🌾</span> {sub.producerName || "Producteur local"}
              </p>

              {/* Liste horizontale des légumes rattachés à cette récolte */}
              <div className="flex flex-wrap gap-2 pt-1">
                {sub.items?.map((item, index) => (
                  <span
                    key={index}
                    className="text-[10px] bg-gray-50 border border-gray-150 text-gray-600 px-2.5 py-0.5 rounded-lg font-bold"
                  >
                    {item.quantity || item.qty} {item.unit || "kg"} •{" "}
                    {item.title || item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* État logistique local du maraîcher */}
            <div className="text-left md:text-right space-y-1 self-stretch md:self-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 border-dashed border-gray-200 pt-3 md:pt-0">
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  sub.status === "A_PREPARER"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}
              >
                {sub.status === "A_PREPARER"
                  ? "En récolte..."
                  : "Prêt en Hangar"}
              </span>

              {sub.batchNumbers && sub.batchNumbers.length > 0 && (
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                  HACCP Lot : {sub.batchNumbers.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import {
  Layers,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
  Package,
  Calendar,
} from "lucide-react";

/**
 * 🧑‍🌾 COMPOSANT : PickupLeg.jsx
 * Responsabilité unique : Gérer la liste des enlèvements de marchandises dans les hangars maraîchers.
 * Affiche les légumes récoltés et les numéros de lots HACCP pour chaque producteur,
 * avec l'action de confirmation de collecte logistique.
 */
export default function PickupLeg({ pickups, onConfirmPickup, processingId }) {
  if (pickups.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-dashed rounded-2xl p-6">
        <Package className="mx-auto text-gray-300 mb-2 stroke-1" size={36} />
        <p className="text-xs font-bold text-gray-500">
          Aucun colis maraîcher prêt au ramassage.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Dès qu'un producteur valide sa préparation HACCP, le point de
          ramassage apparaît ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          Étape 1 : Tournée de Ramassage
        </span>
        <span className="text-xs text-gray-400 font-semibold">
          ({pickups.length} producteurs à visiter)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pickups.map((pickup) => (
          <div
            key={pickup.producerId}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-amber-200 transition-all"
          >
            {/* Infos Maraîcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧑‍🌾</span>
                  <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
                    {pickup.producerName}
                  </h4>
                </div>
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  <MapPin size={12} className="text-gray-300" />{" "}
                  {pickup.producerAddress || "Exploitation locale"}
                </p>
              </div>

              {/* Téléphone maraîcher */}
              {pickup.producerPhone && (
                <a
                  href={`tel:${pickup.producerPhone}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-700 font-semibold border px-3 py-1 rounded-lg bg-gray-50/50 hover:bg-amber-50/20 transition-all"
                >
                  <Phone size={12} /> {pickup.producerPhone}
                </a>
              )}
            </div>

            {/* Légumes à charger */}
            <div className="py-4 space-y-2.5">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">
                Colis prêts en hangar (A récolter) :
              </p>
              <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-3.5 space-y-3">
                {pickup.subOrders.map((sub) => (
                  <div
                    key={sub.id}
                    className="border-b border-dashed border-gray-200 last:border-0 pb-2.5 last:pb-0 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono text-gray-400 font-bold">
                        Bon #{sub.subOrderId || sub.id.substring(0, 8)}
                      </span>
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        HACCP : {sub.batchNumbers?.join(", ") || "N/A"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sub.items?.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-bold"
                        >
                          {item.quantity || item.qty} {item.unit || "kg"} •{" "}
                          {item.title || item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton de confirmation d'enlèvement */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold">
                {pickup.subOrders.length} sous-commande(s) à récupérer
              </span>
              <button
                onClick={() =>
                  onConfirmPickup(pickup.producerId, pickup.subOrders)
                }
                disabled={processingId === pickup.producerId}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                {processingId === pickup.producerId ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Confirmer l'enlèvement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { Store, MapPin, Phone, Truck } from "lucide-react";

/**
 * 🌾 COMPOSANT : PickupLeg.jsx
 * Module de ramassage logistique chez les maraîchers partenaires.
 */
export default function PickupLeg({ pickups = [], onConfirmPickup, processingId }) {
  if (!pickups || pickups.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-md border border-dashed border-slate-300 text-slate-400 font-bold italic text-xs">
        Aucune collecte en attente pour cette tournée.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans text-slate-800">
      {pickups.map((pickup) => {
        const producerId = pickup.producerId;
        const isProcessing = processingId === producerId;
        const subOrders = pickup.subOrders || [];
        const totalItemsCount = subOrders.reduce((acc, sub) => {
          const items = Array.isArray(sub.items) ? sub.items : [];
          return acc + items.reduce((iAcc, item) => iAcc + Number(item.quantity || item.qty || 1), 0);
        }, 0);

        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `\\({pickup.producerName} \\){pickup.producerAddress}`
        )}`;

        return (
          <div
            key={producerId}
            className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3.5 hover:border-slate-300 transition-colors"
          >
            {/* En-tête Exploitation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md">
                    <Store size={16} />
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {pickup.producerName}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-700 shrink-0" />
                  <span>{pickup.producerAddress}</span>
                </p>
              </div>

              {/* Raccourcis Livreur */}
              <div className="flex items-center gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 font-bold rounded border border-slate-200 flex items-center gap-1 text-[10px] transition-colors"
                  title="Ouvrir dans Google Maps"
                >
                  <MapPin size={12} />
                  <span>GPS</span>
                </a>
                {pickup.producerPhone && (
                  <a
                    href={`tel:${pickup.producerPhone}`}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-800 font-bold rounded border border-slate-200 flex items-center gap-1 text-[10px] transition-colors"
                  >
                    <Phone size={12} />
                    <span>Appeler</span>
                  </a>
                )}
              </div>
            </div>

            {/* Récapitulatif des sous-commandes */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Colis & Lots Sanitaires à Ramasser ({subOrders.length} bon(s) / {totalItemsCount} unités)
              </span>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
                {subOrders.map((sub) => {
                  const items = Array.isArray(sub.items) ? sub.items : [];
                  const lot = sub.lotNumber || sub.batchNumber || "LOT-HACCP";

                  return (
                    <div key={sub.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-xs font-mono">
                            #{sub.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-emerald-200">
                            N° Lot : {lot}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Client : <strong>{sub.buyerName || "Acheteur"}</strong> ({items.length} réf.)
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Prêt à Enlever
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirmation de chargement */}
            <button
              type="button"
              onClick={() => onConfirmPickup(producerId, subOrders)}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-md text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Truck size={16} />
              <span>
                {isProcessing ? "Chargement en cours..." : "Confirmer le Chargement en Véhicule"}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

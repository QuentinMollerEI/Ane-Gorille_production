import React from "react";
import {
  MapPin,
  Phone,
  Map,
  CheckCircle2,
  ChevronRight,
  PackageOpen,
} from "lucide-react";

/**
 * 🌾 COMPOSANT : PickupLeg.jsx
 * Responsabilité unique : Gérer la liste des enlèvements physiques chez les producteurs maraîchers (SRP).
 */
export default function PickupLeg({
  pickups = [],
  onConfirmPickup,
  processingId,
}) {
  if (pickups.length === 0) {
    return (
      <div className="bg-white border border-gray-250 rounded-2xl p-8 text-center text-gray-400 italic shadow-sm flex flex-col items-center gap-3">
        <PackageOpen size={36} className="text-gray-300" />
        <p className="text-xs font-semibold">
          Aucun colis n'est actuellement prêt pour un enlèvement maraîcher.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pickups.map((p) => {
        const isProcessing = processingId === p.producerId;

        // URL Google Maps dynamique
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          p.producerAddress || p.producerName,
        )}`;

        return (
          <div
            key={p.producerId}
            className="bg-white border border-gray-250 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* En-tête du point de ramassage */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md">
                  Maraîcher Exploitant
                </span>
                <h4 className="text-sm font-black text-gray-900">
                  {p.producerName}
                </h4>
              </div>

              {/* Raccourcis d'action de navigation et contact */}
              <div className="flex items-center gap-2">
                {p.producerPhone && (
                  <a
                    href={`tel:${p.producerPhone}`}
                    className="p-2 border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                    title="Appeler l'exploitant"
                  >
                    <Phone size={15} />
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                  title="Ouvrir l'itinéraire GPS"
                >
                  <Map size={15} />
                  <span className="hidden sm:inline">GPS</span>
                </a>
              </div>
            </div>

            {/* Détails logistiques */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2.5 text-xs font-semibold text-gray-600">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">
                    Adresse d'enlèvement
                  </span>
                  <span className="text-gray-900 font-bold">
                    {p.producerAddress || "Adresse non fournie"}
                  </span>
                </p>
              </div>

              {/* Liste des colis maraîchers à collecter */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                  Colis à charger ({p.subOrders.length})
                </span>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/30">
                  {p.subOrders.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 text-xs flex justify-between items-center bg-white/50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            #BP-{sub.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-400">
                            Pour : {sub.buyerName}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {sub.items
                            ?.map((it) => `${it.name} (x${it.quantity})`)
                            .join(", ")}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation de chargement */}
              <div className="border-t border-gray-50 pt-4 flex justify-end">
                <button
                  onClick={() => onConfirmPickup(p.producerId, p.subOrders)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Chargement...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Confirmer l'enlèvement ({p.subOrders.length} colis)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

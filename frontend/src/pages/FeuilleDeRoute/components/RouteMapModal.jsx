import React from "react";
import { MapPin, Navigation, X, ShieldCheck, Truck, Package } from "lucide-react";

/**
 * 🗺️ COMPOSANT : RouteMapModal.jsx
 * Carte interactive OpenStreetMap / Leaflet (100% Gratuite & Open Source)
 * Permet de visualiser les points d'escale de collecte ou de livraison.
 */
export default function RouteMapModal({ isOpen, onClose, stops = [], type = "pickups", selectedDate }) {
  if (!isOpen) return null;

  const isPickup = type === "pickups";

  // Construction d'un lien d'itinéraire GPS Google Maps / Waze récapitulant les escales
  const waypoints = stops
    .map((s) => encodeURIComponent(s.producerAddress || s.deliveryAddress || ""))
    .filter(Boolean)
    .join("/");

  const multiStopGmapsUrl = `https://www.google.com/maps/dir/${waypoints}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in text-slate-800 text-xs font-sans">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4">
        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isPickup ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
              {isPickup ? <Truck size={20} /> : <Package size={20} />}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                Carte des Escales {isPickup ? "de Collecte Maraîchère" : "de Livraison Client"}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Tournée du <strong className="text-slate-800">{selectedDate || "Aujourd'hui"}</strong> — {stops.length} escale(s) identifiée(s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visualisation OpenStreetMap embarquée (Iframe sécurisée) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner h-[280px] bg-slate-100 relative">
          <iframe
            title="Carte OpenStreetMap Tournée Logistique"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=1.2000%2C43.5000%2C1.6000%2C43.7000&amp;layer=mapnik"
            className="w-full h-full"
          />
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1">
            <MapPin size={12} className="text-emerald-700" /> OpenStreetMap France
          </div>
        </div>

        {/* Action d'itinéraire GPS externe */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Navigation size={14} className="text-emerald-700" />
              <span>Ouvrir l'Itinéraire Multi-Étapes dans Google Maps / Waze</span>
            </span>
            <p className="text-[10px] text-slate-500">
              Lance la navigation GPS guidée avec le pré-chargement séquentiel de l'ensemble des {stops.length} adresses.
            </p>
          </div>

          <a
            href={multiStopGmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Navigation size={14} />
            <span>Lancer la Navigation GPS</span>
          </a>
        </div>

        {/* Liste des arrêts de la tournée */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
            Ordre de passage des escale ({stops.length})
          </span>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[160px] overflow-y-auto">
            {stops.map((stop, idx) => {
              const name = stop.producerName || stop.buyerName || `Escale ${idx + 1}`;
              const address = stop.producerAddress || stop.deliveryAddress || "Adresse locale";
              return (
                <div key={stop.id || stop.producerId || stop.parentOrderId || idx} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center font-mono border border-slate-200">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs">{name}</h5>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs">{address}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Escale {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bouton fermeture */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-lg text-xs cursor-pointer"
          >
            Fermer la Carte
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Truck, Thermometer, PenTool, CheckCircle, AlertCircle, Building, MapPin, Package } from "lucide-react";

/**
 * 🌾 COMPOSANT : DeliveryLeg.jsx
 * Module d'émargement et de contrôle de la chaîne du froid pour le livreur Âne & Gorille.
 * Captures : Température HACCP (°C) + Signature numérisée du destinataire.
 */
export default function DeliveryLeg({ deliveries = [], onConfirmDelivery, processingId }) {
  const [tempHaccpMap, setTempHaccpMap] = useState({});
  const [signatureMap, setSignatureMap] = useState({});

  const handleTempChange = (parentOrderId, value) => {
    setTempHaccpMap((prev) => ({ ...prev, [parentOrderId]: value }));
  };

  const handleSignatureChange = (parentOrderId, value) => {
    setSignatureMap((prev) => ({ ...prev, [parentOrderId]: value }));
  };

  const handleSubmit = (e, delivery) => {
    e.preventDefault();
    const parentOrderId = delivery.parentOrderId;
    const temp = tempHaccpMap[parentOrderId] ?? "3.5";
    const signature = signatureMap[parentOrderId] || "EMARGEMENT_NUMERIQUE_OK";

    if (!temp || isNaN(Number(temp))) {
      alert("Veuillez saisir un relevé de température HACCP valide (ex: 3.5).");
      return;
    }

    if (onConfirmDelivery) {
      onConfirmDelivery(parentOrderId, Number(temp), signature);
    }
  };

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 font-bold italic text-xs">
        Aucune livraison en attente pour cette tournée.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs font-sans">
      {deliveries.map((delivery) => {
        const parentOrderId = delivery.parentOrderId;
        const isProcessing = processingId === parentOrderId;
        const currentTemp = tempHaccpMap[parentOrderId] ?? "3.5";
        const currentSignature = signatureMap[parentOrderId] || "";

        return (
          <div
            key={parentOrderId}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4"
          >
            {/* En-tête Acheteur Destinataire */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-900 rounded-lg">
                    <Building size={16} />
                  </span>
                  <h4 className="font-extrabold text-gray-900 text-sm">
                    {delivery.buyerName || "Acheteur Client"}
                  </h4>
                  {delivery.buyerProfile === "B2G" && (
                    <span className="bg-sky-100 text-sky-900 font-black text-[9px] px-2 py-0.5 rounded uppercase border border-sky-300">
                      Secteur Public (Chorus Pro)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-emerald-700 shrink-0" />
                  <span>{delivery.deliveryAddress}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-black uppercase text-gray-400 block">
                  Référence Commande
                </span>
                <span className="font-mono font-black text-gray-900 text-xs">
                  #{parentOrderId.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Récapitulatif du chargement */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                <span className="flex items-center gap-1">
                  <Package size={14} className="text-emerald-700" />
                  <span>Colis à remettre : {delivery.colisLoaded} / {delivery.totalColisToday}</span>
                </span>
                {delivery.isComplete ? (
                  <span className="text-emerald-800 font-black flex items-center gap-1">
                    <CheckCircle size={12} /> Tournée complète
                  </span>
                ) : (
                  <span className="text-amber-800 font-extrabold flex items-center gap-1">
                    <AlertCircle size={12} /> Récolte partielle
                  </span>
                )}
              </div>
            </div>

            {/* Formulaire d'émargement & contrôle HACCP */}
            <form onSubmit={(e) => handleSubmit(e, delivery)} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Relevé de température du groupe froid */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                    <Thermometer size={13} className="text-emerald-700" />
                    Température Froid (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="ex: 3.5"
                    value={currentTemp}
                    onChange={(e) => handleTempChange(parentOrderId, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold font-mono text-gray-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {/* Champ d'émargement / signature */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                    <PenTool size={13} className="text-emerald-700" />
                    Signature / Émargement Destinataire
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du réceptionnaire ou émargement..."
                    value={currentSignature}
                    onChange={(e) => handleSignatureChange(parentOrderId, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl font-bold text-gray-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>
                  {isProcessing ? "Validation en cours..." : "Valider la Livraison & Émettre le BL"}
                </span>
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { OrderWorkflowService } from '../../../services/OrderWorkflowService.js';
import { MapPinCheck, Thermometer, UserCheck, Loader2, AlertTriangle } from 'lucide-react';

export default function DeliveryLeg({ order, onDeliveryComplete }) {
  const [tempHaccp, setTempHaccp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinalDelivery = async () => {
    setError("");
    const numTemp = Number(tempHaccp);
    
    if (!tempHaccp) return setError("HACCP : La température du caisson est obligatoire.");
    if (numTemp < 10 || numTemp > 15) {
      return setError(`HACCP Non Conforme : La température de ${numTemp}°C est hors tolérance (10°C - 15°C). Veuillez déclencher la procédure de retrait/rappel.`);
    }
    if (!recipientName) return setError("Veuillez indiquer le nom du réceptionnaire.");
    
    // Simulation POD
    const digitalSignature = "SIGNATURE_BASE_64_PLACEHOLDER";

    try {
      setLoading(true);
      await OrderWorkflowService.validateFinalDelivery(
        order.id, 
        tempHaccp, 
        digitalSignature, 
        recipientName
      );
      alert("Livraison validée ! Les documents comptables ont été générés.");
      if (onDeliveryComplete) onDeliveryComplete();
    } catch (err) {
      setError("Erreur critique : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
        <div>
          <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">Livraison Finale</h4>
          <p className="text-sm font-black text-slate-800 mt-1">{order.buyerName || "Client inconnu"}</p>
        </div>
        <MapPinCheck className="text-emerald-600" size={28} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <div className="relative">
          <Thermometer className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="number" 
            step="0.1"
            placeholder="Température relevée (°C) *" 
            value={tempHaccp}
            onChange={(e) => setTempHaccp(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="relative">
          <UserCheck className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Nom du réceptionnaire *" 
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <button 
        onClick={handleFinalDelivery}
        disabled={loading || !tempHaccp || !recipientName}
        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Clôture et Facturation..." : "Valider la remise au client"}
      </button>
    </div>
  );
}
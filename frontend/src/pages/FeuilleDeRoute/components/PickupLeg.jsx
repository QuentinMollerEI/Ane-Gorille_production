import React, { useState } from 'react';
import { OrderWorkflowService } from '../../../services/OrderWorkflowService';
import { PackageCheck, Loader2 } from 'lucide-react';

/**
 * 📦 COMPOSANT : PickupLeg.jsx
 * Emplacement : frontend/src/pages/FeuilleDeRoute/components/PickupLeg.jsx
 *
 * Correctif : Remplacement de l'icône inexistante 'PackageUp' par 'PackageCheck' dans lucide-react.
 */
export default function PickupLeg({ subOrder, carrierId, onPickupComplete }) {
  const [loading, setLoading] = useState(false);

  const handlePickup = async () => {
    try {
      setLoading(true);
      await OrderWorkflowService.validatePickup(subOrder.id, carrierId);
      if (onPickupComplete) onPickupComplete();
    } catch (error) {
      alert("Erreur lors du ramassage : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-orange-950 text-xs uppercase tracking-wider">Étape : Ramassage</h4>
          <p className="text-sm font-black text-slate-800 mt-1">{subOrder.producerName}</p>
          <p className="text-xs text-slate-600 font-mono mt-0.5">
            Colis #{subOrder.id.slice(0, 8).toUpperCase()} (Lot: {subOrder.lotNumber || subOrder.batchNumber || "Non renseigné"})
          </p>
        </div>
        <PackageCheck className="text-orange-500" size={24} />
      </div>

      <button
        onClick={handlePickup}
        disabled={loading || subOrder.status !== "A_RAMASSER"}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {subOrder.status === "A_RAMASSER" ? "Confirmer le chargement camion" : "Déjà chargé"}
      </button>
    </div>
  );
}

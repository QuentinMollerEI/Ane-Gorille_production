import React, { useState } from 'react';
import { OrderWorkflowService } from '../../../services/OrderWorkflowService';
import { Play, CheckCircle2, Loader2, Package } from 'lucide-react';

export default function ToHarvestCompartment({ subOrders = [], onStatusChange }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleStartHarvest = async (subOrderId) => {
    try {
      setLoadingId(subOrderId);
      await OrderWorkflowService.startHarvest(subOrderId);
      if (onStatusChange) onStatusChange(); // Rafraîchit les données Firestore
    } catch (error) {
      alert("Erreur lors du démarrage : " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleValidatePreparation = async (subOrderId) => {
    const lotNumber = prompt("Traçabilité HACCP : Entrez le numéro de lot pour ce carton (laissez vide pour générer automatiquement) :");
    if (lotNumber === null) return; // Action annulée par le producteur

    try {
      setLoadingId(subOrderId);
      await OrderWorkflowService.validatePreparation(subOrderId, lotNumber);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert("Erreur lors de la validation : " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  if (subOrders.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
        <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <p>Aucune commande en attente de préparation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subOrders.map((order) => (
        <div key={order.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Infos de la commande */}
          <div>
            <h3 className="font-black text-slate-800 text-sm">Commande #{order.id.slice(0, 8).toUpperCase()}</h3>
            <p className="text-xs text-slate-500 font-medium">Pour : {order.buyerName}</p>
            <p className="text-xs text-emerald-700 font-bold mt-1">{order.items?.length || 0} articles à préparer</p>
          </div>

          {/* Actions basées sur le statut exact */}
          <div className="w-full sm:w-auto">
            {order.status === "A_PREPARER" && (
              <button
                onClick={() => handleStartHarvest(order.id)}
                disabled={loadingId === order.id}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {loadingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Démarrer la récolte
              </button>
            )}

            {order.status === "EN_PREPARATION" && (
              <button
                onClick={() => handleValidatePreparation(order.id)}
                disabled={loadingId === order.id}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {loadingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Colis prêt (Saisir le Lot)
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
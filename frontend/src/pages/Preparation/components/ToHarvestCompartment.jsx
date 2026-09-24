import React, { useState } from 'react';
import { OrderWorkflowService } from '../../../services/OrderWorkflowService';
import { Loader2, CheckCircle, Package } from 'lucide-react';

export default function ToHarvestCompartment({ subOrders, onStatusChange }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleStartHarvest = async (subOrderId) => {
    try {
      setLoadingId(subOrderId);
      await OrderWorkflowService.startHarvest(subOrderId);
      // Appelle une fonction parente pour rafraîchir la liste via Firestore snapshot
      if (onStatusChange) onStatusChange(); 
    } catch (error) {
      alert("Erreur: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleValidatePreparation = async (subOrderId) => {
    const lotNumber = prompt("Entrez le numéro de lot HACCP (Laissez vide pour générer auto) :");
    if (lotNumber === null) return; // Annulé par l'utilisateur

    try {
      setLoadingId(subOrderId);
      await OrderWorkflowService.validatePreparation(subOrderId, lotNumber);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      alert("Erreur: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  // ... (Ton affichage JSX habituel de la liste des commandes)
  // Utilise ces boutons pour déclencher les actions :
  /*
    {subOrder.status === 'A_PREPARER' && (
      <button onClick={() => handleStartHarvest(subOrder.id)}>
        Démarrer
      </button>
    )}
    {subOrder.status === 'EN_PREPARATION' && (
      <button onClick={() => handleValidatePreparation(subOrder.id)}>
        Valider le colis
      </button>
    )}
  */
}
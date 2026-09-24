import React, { useState } from 'react';
import { OrderWorkflowService } from '../../../services/OrderWorkflowService';

export default function DeliveryLeg({ order, onDeliveryComplete }) {
  const [tempHaccp, setTempHaccp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isDelivering, setIsDelivering] = useState(false);

  const handleFinalDelivery = async () => {
    if (!tempHaccp) return alert("Veuillez saisir la température du camion.");
    
    // Dans ton app finale, tu auras un Canvas pour la signature. 
    // Ici on simule le Base64.
    const fakeSignature = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUC...";

    try {
      setIsDelivering(true);
      await OrderWorkflowService.validateFinalDelivery(
        order.id, 
        tempHaccp, 
        fakeSignature, 
        recipientName
      );
      alert("Livraison validée et factures générées !");
      if (onDeliveryComplete) onDeliveryComplete();
    } catch (error) {
      alert("Erreur de livraison: " + error.message);
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl space-y-4 bg-white">
      <h3 className="font-bold">Livraison Commande #{order.id.slice(0,8)}</h3>
      
      <input 
        type="number" 
        placeholder="Température Camion (°C)" 
        value={tempHaccp}
        onChange={(e) => setTempHaccp(e.target.value)}
        className="border p-2 rounded w-full"
      />
      
      <input 
        type="text" 
        placeholder="Nom du signataire" 
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button 
        onClick={handleFinalDelivery}
        disabled={isDelivering || !tempHaccp}
        className="w-full bg-emerald-600 text-white font-bold p-3 rounded"
      >
        {isDelivering ? "Génération comptable..." : "Valider la livraison"}
      </button>
    </div>
  );
}
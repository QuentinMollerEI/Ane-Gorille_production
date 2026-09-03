import React, { useState } from 'react';
import { Truck, CheckCircle, PenTool } from 'lucide-react';

export default function DriverDeliveryView() {
  const [deliveries, setDeliveries] = useState([
    { id: 'LIV-2026-102', client: 'Mairie de Toulouse (Cantine)', status: 'attente_signature', qty: '30.0 kg de légumes' }
  ]);

  const handleSign = (deliveryId) => {
    setDeliveries(prev => prev.map(dev => {
      if (dev.id !== deliveryId) return dev;
      return { ...dev, status: 'livre' };
    }));
    alert(`Livraison émargée numériquement. Le statut de commande de l'acheteur a été mis à jour et le paiement est validé.`);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <Truck className="mr-2 text-brand-gold" size={20} />
          Ramassage, Livraison & Émargement
        </h3>
        <p className="text-xs text-gray-500 mt-1">Faites émarger la réception sur votre écran tactile pour clore la livraison.</p>
      </div>

      <div className="space-y-4 text-xs">
        {deliveries.map((dev) => (
          <div key={dev.id} className="border border-gray-150 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-brand-dark">{dev.id}</h4>
                <p className="text-gray-400 mt-0.5">Destinataire : {dev.client}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                dev.status === 'livre' ? 'bg-green-50 text-brand-green border border-green-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
              }`}>
                {dev.status === 'livre' ? 'Terminé' : 'En attente de signature'}
              </span>
            </div>

            <p className="font-medium text-gray-700">Contenu à délivrer : <span className="font-bold text-brand-green">{dev.qty}</span></p>

            {dev.status !== 'livre' ? (
              <div className="border border-dashed border-gray-250 p-6 rounded-xl flex flex-col items-center justify-center space-y-3">
                <PenTool className="text-gray-400" size={24} />
                <button
                  onClick={() => handleSign(dev.id)}
                  className="px-4 py-2 bg-brand-green text-white font-bold rounded-lg hover:bg-opacity-95 transition-all text-[11px]"
                >
                  Faire émarger le réceptionnaire
                </button>
              </div>
            ) : (
              <div className="p-3 bg-green-50 text-brand-green rounded-xl font-semibold text-center border border-green-150">
                ✓ Livraison validée et émargée avec succès le 02/09/2026 à 10:24
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

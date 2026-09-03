import React, { useState } from 'react';
import { Truck, Thermometer, ShieldCheck, Printer, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DelivererView({ user }) {
  // Liste fictive des tournées en cours basée sur votre cahier des charges
  const [deliveries, setDeliveries] = useState([
    {
      id: 'TR-2026-901',
      producer: 'Producteur de la Rosée',
      buyer: 'Cantine Municipale Rive Gauche',
      address: '45 Rue de la République, 31000 Toulouse',
      status: 'À collecter',
      tempTarget: '4°C à 8°C',
      tempMeasured: '',
      haccpValidated: false
    },
    {
      id: 'TR-2026-898',
      producer: 'Vergers Âne & Gorille',
      buyer: 'Épicerie Solidaire du Centre',
      address: '12 Avenue des Producteurs, 31400 Toulouse',
      status: 'En transit',
      tempTarget: '4°C à 8°C',
      tempMeasured: '5.4',
      haccpValidated: true
    }
  ]);

  const [tempInput, setTempInput] = useState('');

  const handleHaccpSubmit = (id) => {
    if (!tempInput || isNaN(tempInput)) {
      alert("Veuillez saisir une température valide en °C.");
      return;
    }

    setDeliveries(prev => prev.map(delivery => {
      if (delivery.id === id) {
        return {
          ...delivery,
          tempMeasured: tempInput,
          haccpValidated: true,
          status: 'Prêt pour livraison'
        };
      }
      return delivery;
    }));

    setTempInput('');
    alert("Enregistrement réglementaire HACCP validé avec succès.");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-brand-green flex items-center">
          <Truck size={20} className="mr-2 text-brand-gold" />
          Planification & Traçabilité Logistique (HACCP)
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Suivez vos feuilles de route, validez la chaîne du froid et téléchargez vos documents DREAL officiels.
        </p>
      </div>

      {/* Liste des Tournées Actives */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Mes livraisons du jour</h3>

        <div className="grid grid-cols-1 gap-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Informations Générales */}
              <div className="space-y-2 flex-grow">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-gray-400">{delivery.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    delivery.status === 'À collecter' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {delivery.status}
                  </span>
                </div>
                <h4 className="font-bold text-base text-brand-dark">
                  {delivery.producer} → {delivery.buyer}
                </h4>
                <p className="text-xs text-gray-500">Adresse : {delivery.address}</p>
              </div>

              {/* Module de Contrôle HACCP */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 min-w-[280px]">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Thermometer size={18} className="text-brand-green" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Temp. Cible</p>
                    <p className="text-xs font-semibold">{delivery.tempTarget}</p>
                  </div>
                </div>

                {delivery.haccpValidated ? (
                  <div className="flex items-center text-brand-green space-x-1">
                    <CheckCircle size={16} />
                    <span className="text-xs font-bold">Validé ({delivery.tempMeasured}°C)</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Ex: 5.5"
                      value={tempInput}
                      onChange={(e) => setTempInput(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md text-center focus:outline-brand-green"
                    />
                    <button
                      onClick={() => handleHaccpSubmit(delivery.id)}
                      className="bg-brand-green text-white hover:bg-opacity-90 text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all"
                    >
                      Valider
                    </button>
                  </div>
                )}
              </div>

              {/* Bons & DREAL */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert(`Impression du Bon de ramassage & de livraison pour ${delivery.id}`)}
                  className="p-2 rounded-lg bg-gray-50 hover:bg-brand-green hover:text-white text-gray-500 transition-colors"
                  title="Imprimer les documents"
                >
                  <Printer size={15} />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

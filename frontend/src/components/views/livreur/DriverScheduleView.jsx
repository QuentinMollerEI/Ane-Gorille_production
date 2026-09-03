import React, { useState } from 'react';
import { Calendar, MapPin, ArrowRight, Play } from 'lucide-react';

export default function DriverScheduleView() {
  const [route] = useState({
    id: 'TR-2026-901',
    driver: 'Jean-Pierre (LogiVert)',
    vehicle: 'Fourgon Isotherme - Renault Master (Licence DREAL conforme)',
    stops: [
      { id: 1, type: 'ramassage', name: 'Producteur de la Rosée', address: 'Bassin Agricole, Ramonville-Saint-Agne', time: '08:00' },
      { id: 2, type: 'livraison', name: 'Mairie de Toulouse (Cantine)', address: '1 Place du Capitole, Toulouse', time: '10:00' }
    ]
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <Calendar className="mr-2 text-brand-gold" size={20} />
          Feuille de Route & Planification des Tournées
        </h3>
        <p className="text-xs text-gray-500 mt-1">Consultez votre itinéraire quotidien de collecte et d'acheminement des légumes.</p>
      </div>

      <div className="space-y-4 text-xs">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
          <p className="font-bold text-brand-dark">Tournée active : {route.id}</p>
          <p className="text-gray-500 font-semibold">Véhicule assigné : {route.vehicle}</p>
        </div>

        {/* Éléments de parcours de la tournée */}
        <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-green/25 pl-4">
          {route.stops.map((stop) => (
            <div key={stop.id} className="relative flex gap-4 items-start">
              <div className={`w-3.5 h-3.5 rounded-full absolute -left-[22px] border-2 border-white flex items-center justify-center ${
                stop.type === 'ramassage' ? 'bg-brand-gold' : 'bg-brand-green'
              }`} />
              <div className="flex-grow p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded mr-2 ${
                    stop.type === 'ramassage' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-brand-green'
                  }`}>
                    {stop.type}
                  </span>
                  <span className="font-bold text-brand-dark">{stop.name}</span>
                  <p className="text-gray-400 mt-1.5 flex items-center"><MapPin size={12} className="mr-1" /> {stop.address}</p>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                  <span className="font-bold text-brand-dark">{stop.time}</span>
                  <button
                    onClick={() => alert(`Démarrage de l'itinéraire vers : ${stop.name}`)}
                    className="p-1.5 bg-brand-green text-white hover:bg-opacity-95 rounded-lg flex items-center justify-center"
                  >
                    <Play size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

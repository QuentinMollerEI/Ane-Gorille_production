import React, { useState } from 'react';
import { ShieldAlert, HeartPulse, XCircle, AlertTriangle } from 'lucide-react';

export default function AdminHaccpView() {
  const [alerts] = useState([
    {
      id: 'ALT-1092',
      date: '02/09/2026',
      type: 'Rupture Chaîne du Froid',
      details: 'Température mesurée : 9.2°C lors de la tournée TR-2026-901 (Cible max : 8°C)',
      status: 'active', // 'active' ou 'resolved'
      driver: 'Jean-Pierre (LogiVert)',
      lot: 'LOT-CAR-042'
    }
  ]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-250 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <ShieldAlert className="mr-2 text-brand-gold" size={20} />
          Centre de Sécurité & Veille Sanitaire (HACCP)
        </h3>
        <p className="text-xs text-gray-500 mt-1">Supervisez les écarts de température et les alertes sanitaires en temps réel.</p>
      </div>

      <div className="space-y-4 text-xs">
        {alerts.map((alt) => (
          <div key={alt.id} className="border border-red-150 bg-red-50/40 p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-red-100 pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-red-600" size={16} />
                <span className="font-bold text-red-700 uppercase tracking-wide">{alt.type}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold uppercase text-[9px]">Alerte Active</span>
            </div>

            <p className="font-semibold text-gray-700">{alt.details}</p>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600">
              <p><strong>Livreur :</strong> {alt.driver}</p>
              <p><strong>Numéro de Lot concerné :</strong> <span className="font-mono font-bold text-red-600">{alt.lot}</span></p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-red-100">
              <button
                onClick={() => alert(`Rappel de lot enclenché pour ${alt.lot}. Notification envoyée aux acheteurs municipaux.`)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Enclencher le protocole de rappel de lot
              </button>
              <button
                onClick={() => alert("Alerte sanitaire close.")}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
              >
                Ignorer / Clôturer l'alerte
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

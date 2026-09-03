import React, { useState } from 'react';
import { HeartPulse, ShieldAlert, Check } from 'lucide-react';

export default function DriverHaccpView() {
  const [temp, setTemp] = useState('4.8');
  const [logs, setLogs] = useState([
    { deliveryId: 'LIV-2026-102', time: '08:15', temp: '4.8°C', status: 'Conforme (Isotherme)' }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!temp) return;
    const newLog = {
      deliveryId: 'LIV-2026-102',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      temp: `${temp}°C`,
      status: parseFloat(temp) > 8 ? 'ALERTE TEMPÉRATURE' : 'Conforme (Isotherme)'
    };
    setLogs([newLog, ...logs]);
    alert("Enregistrement du relevé de chaîne du froid effectué.");
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <HeartPulse className="mr-2 text-brand-gold" size={20} />
          Registre de Température de Transport (HACCP)
        </h3>
        <p className="text-xs text-gray-500 mt-1">Saisissez la température intérieure du caisson frigorifique lors du chargement et du déchargement.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs">
        <div className="flex-grow">
          <label className="block font-bold text-gray-500 uppercase mb-1">Température intérieure mesurée (°C)</label>
          <input
            type="number"
            step="0.1"
            required
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 bg-white rounded-lg focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 h-10 bg-brand-green hover:bg-opacity-95 text-white font-bold rounded-lg transition-colors"
        >
          Valider le contrôle
        </button>
      </form>

      {/* Logs de transport */}
      <div className="space-y-2 text-xs">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contrôles sanitaires de la journée</h4>
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${
              parseFloat(log.temp) > 8 ? 'bg-red-50 border-red-150 text-red-950' : 'bg-gray-50 border-gray-100'
            }`}>
              <div>
                <p className="font-bold">Livraison {log.deliveryId} — À {log.time}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{log.status}</p>
              </div>
              <span className={`font-mono font-bold text-sm ${parseFloat(log.temp) > 8 ? 'text-red-600' : 'text-brand-green'}`}>
                {log.temp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

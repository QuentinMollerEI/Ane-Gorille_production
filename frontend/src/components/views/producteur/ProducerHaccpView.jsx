import React, { useState } from 'react';
import { HeartPulse, CheckCircle, ShieldAlert } from 'lucide-react';

export default function ProducerHaccpView() {
  const [temp, setTemp] = useState('4.2');
  const [clean, setClean] = useState(false);
  const [logs, setLogs] = useState([
    { date: '02/09/2026', temp: '4.2°C', clean: 'Conforme', user: 'Quentin (Exploitant)' }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!temp) return;
    const newLog = {
      date: new Date().toLocaleDateString('fr-FR'),
      temp: `${temp}°C`,
      clean: clean ? 'Conforme' : 'Non validé',
      user: 'Quentin (Exploitant)'
    };
    setLogs([newLog, ...logs]);
    setClean(false);
    alert("Enregistrement du registre de contrôle sanitaire HACCP effectué.");
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <HeartPulse className="mr-2 text-brand-gold" size={20} />
          Plan de Maîtrise Sanitaire (PMS / HACCP)
        </h3>
        <p className="text-xs text-gray-500 mt-1">Saisie quotidienne obligatoire des températures de stockage de vos légumes.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs">
        <div>
          <label className="block font-bold text-gray-500 uppercase mb-1">Température Chambre Froide (°C)</label>
          <input
            type="number"
            step="0.1"
            required
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center h-10">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clean}
              onChange={(e) => setClean(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span className="font-semibold text-gray-600">Nettoyage & Désinfection OK</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full h-10 bg-brand-green hover:bg-opacity-95 text-white font-bold rounded-lg transition-colors"
        >
          Enregistrer le log quotidien
        </button>
      </form>

      {/* Historique du PMS */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registre de contrôle des 30 derniers jours</h4>
        <div className="overflow-hidden border border-gray-100 rounded-xl">
          <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Température</th>
                <th className="px-4 py-2">État Hygiène</th>
                <th className="px-4 py-2">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-brand-dark">{log.date}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${parseFloat(log.temp) > 6 ? 'text-red-600' : 'text-brand-green'}`}>
                      {log.temp}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-brand-green font-semibold">
                      <CheckCircle size={12} className="mr-1" /> {log.clean}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

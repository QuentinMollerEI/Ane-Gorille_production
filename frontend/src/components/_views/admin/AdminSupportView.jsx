import React, { useState } from 'react';
import { MessageSquare, Check, CornerDownRight } from 'lucide-react';

export default function AdminSupportView() {
  const [tickets, setTickets] = useState([
    {
      id: 'TCK-2819',
      user: 'Mairie de Toulouse (Acheteur)',
      subject: 'Rejet Chorus Pro : Format XML invalide',
      message: 'La mairie a refusé l\'intégration de la facture car le numéro d\'engagement juridique (EJ) n\'était pas renseigné au format adéquat.',
      status: 'pending'
    }
  ]);

  const handleResolve = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    alert("Ticket d'assistance marqué comme résolu.");
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <MessageSquare className="mr-2 text-brand-gold" size={20} />
          Assistance d'Exploitation & Support Technique
        </h3>
        <p className="text-xs text-gray-500 mt-1">Gérez les demandes de support et guidez les utilisateurs dans leur transition vers le numérique.</p>
      </div>

      <div className="space-y-4 text-xs">
        {tickets.map((t) => (
          <div key={t.id} className="border border-gray-150 rounded-xl p-5 space-y-4 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h4 className="font-bold text-brand-dark text-sm">{t.user}</h4>
                <p className="text-gray-400 mt-0.5">Sujet : {t.subject}</p>
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded uppercase text-[9px]">En attente</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl flex items-start space-x-2">
              <CornerDownRight size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600 leading-relaxed italic">"{t.message}"</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleResolve(t.id)}
                className="px-4 py-2 bg-brand-green text-white hover:bg-opacity-95 rounded-lg font-bold flex items-center transition-colors"
              >
                <Check size={14} className="mr-1.5" /> Marquer comme résolu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

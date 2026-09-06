import React, { useState } from 'react';
import { CheckSquare, Printer, ClipboardList } from 'lucide-react';

export default function ProducerPrepView() {
  const [preps, setPreps] = useState([
    {
      id: 'BPR-2026-44',
      client: 'Mairie de Toulouse (Cantine)',
      date: '02/09/2026',
      items: [
        { name: 'Pommes de terre de la Rosée', qty: '20.0 kg', status: 'pending' },
        { name: 'Carottes fanes locales', qty: '10.0 kg', status: 'pending' }
      ],
      packaging: 'Caisse bois réutilisable consignée (Zéro Déchet Loi AGEC)'
    }
  ]);

  const toggleItem = (prepId, itemIndex) => {
    setPreps(prev => prev.map(prep => {
      if (prep.id !== prepId) return prep;
      const newItems = [...prep.items];
      newItems[itemIndex].status = newItems[itemIndex].status === 'done' ? 'pending' : 'done';
      return { ...prep, items: newItems };
    }));
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <CheckSquare className="mr-2 text-brand-gold" size={20} />
          Préparation & Éco-conditionnement des Commandes
        </h3>
        <p className="text-xs text-gray-500 mt-1">Validez vos récoltes au panier et conditionnez-les selon les normes de consigne environnementale.</p>
      </div>

      <div className="space-y-4">
        {preps.map((prep) => (
          <div key={prep.id} className="border border-gray-150 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 text-xs">
              <div>
                <h4 className="font-bold text-brand-dark text-sm">{prep.id}</h4>
                <p className="text-gray-400 mt-0.5">Destinataire : {prep.client}</p>
              </div>
              <button
                onClick={() => alert(`Impression du Bon d'Expédition et d'Éco-Emballage pour ${prep.id}`)}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 transition-colors"
                title="Imprimer le bon"
              >
                <Printer size={15} />
              </button>
            </div>

            {/* Checklist de préparation */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <ClipboardList size={14} className="mr-1.5" /> Articles à récolter
              </p>
              {prep.items.map((item, idx) => (
                <label key={idx} className="flex items-center space-x-3 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={item.status === 'done'}
                    onChange={() => toggleItem(prep.id, idx)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                  />
                  <span className={`flex-grow font-medium ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.name} — <span className="font-bold text-brand-green">{item.qty}</span>
                  </span>
                </label>
              ))}
            </div>

            {/* Packaging conforme Loi AGEC */}
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg text-[11px] text-amber-900 font-semibold">
              ♻️ Conditionnement obligatoire : {prep.packaging}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

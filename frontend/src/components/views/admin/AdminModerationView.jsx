import React, { useState } from 'react';
import { CheckSquare, Check, X, Award } from 'lucide-react';

export default function AdminModerationView() {
  const [queue, setQueue] = useState([
    {
      id: 'PROD-PEND-01',
      title: 'Fraises Gariguette de Ramonville',
      price: '5.50 €/kg',
      producer: 'Ferme des Écureuils',
      iduAdeme: 'FR384920_01ECOR',
      isBio: true
    }
  ]);

  const handleAction = (id, approved) => {
    setQueue(prev => prev.filter(p => p.id !== id));
    alert(approved ? "Produit approuvé et publié sur la boutique." : "Produit rejeté pour non-conformité administrative.");
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <CheckSquare className="mr-2 text-brand-gold" size={20} />
          Modération du Catalogue & Justificatifs AGEC
        </h3>
        <p className="text-xs text-gray-500 mt-1">Validez la conformité des IDU ADEME et des labels de qualité avant la mise en ligne des produits.</p>
      </div>

      <div className="space-y-4 text-xs">
        {queue.length === 0 ? (
          <p className="text-gray-400 italic text-center py-6">Aucun produit en attente de modération réglementaire.</p>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="border border-gray-150 rounded-xl p-5 space-y-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-brand-dark text-sm">{item.title}</h4>
                  <p className="text-gray-400 mt-0.5">Producteur : {item.producer} • Tarif : {item.price}</p>
                </div>
                {item.isBio && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[9px] uppercase">
                    Ecocert Bio
                  </span>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p><strong>Identifiant Unique ADEME (Loi AGEC) :</strong> <span className="font-mono text-brand-green">{item.iduAdeme}</span></p>
                <p className="text-gray-400 text-[10px]">Statut ADEME SYDEREP : Vérifié conforme éco-emballage.</p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleAction(item.id, false)}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold flex items-center transition-colors"
                >
                  <X size={14} className="mr-1.5" /> Rejeter la fiche
                </button>
                <button
                  onClick={() => handleAction(item.id, true)}
                  className="px-4 py-2 bg-brand-green text-white hover:bg-opacity-95 rounded-lg font-bold flex items-center transition-colors"
                >
                  <Check size={14} className="mr-1.5" /> Approuver et publier
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { FileText, Award, Download } from 'lucide-react';

export default function ProducerAccountingView() {
  const [payments] = useState([
    {
      id: 'ST-CONN-0129',
      date: '01/09/2026',
      salesHT: 1383.89,
      commission: 138.39, // 10% de commission de plateforme
      payout: 1245.50,    // Versé au producteur
      status: 'payout_completed'
    }
  ]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <FileText className="mr-2 text-brand-gold" size={20} />
          Registre des Ventes & Versements Stripe Connect
        </h3>
        <p className="text-xs text-gray-500 mt-1">Suivez vos gains nets de commission directement transférés vers votre compte d'exploitation.</p>
      </div>

      <div className="space-y-4 text-xs">
        {payments.map((p) => (
          <div key={p.id} className="border border-gray-150 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">ID TRANSACTION : {p.id}</span>
                <p className="font-bold text-brand-dark mt-0.5">Versement automatique du {p.date}</p>
              </div>
              <span className="text-sm font-extrabold text-brand-green">Statut : Transféré</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-gray-400 font-semibold uppercase">Total Ventes Brutes</p>
                <p className="font-bold text-brand-dark mt-0.5">{p.salesHT.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Commission (10%)</p>
                <p className="font-bold text-red-600 mt-0.5">- {p.commission.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Versement Net</p>
                <p className="font-extrabold text-brand-green mt-0.5">{p.payout.toFixed(2)} €</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
              <span>⚠️ Facturé sous le régime de l'Article 293 B du CGI (TVA non applicable sur la commission).</span>
              <button
                onClick={() => alert(`Téléchargement de la facture de commission intermédiaire : ${p.id}`)}
                className="flex items-center text-brand-green font-bold hover:underline"
              >
                <Download size={13} className="mr-1" /> Reçu PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

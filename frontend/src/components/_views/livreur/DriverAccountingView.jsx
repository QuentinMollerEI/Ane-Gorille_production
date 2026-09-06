import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

export default function DriverAccountingView() {
  const [payments] = useState([
    { id: 'TR-PAY-98', date: '01/09/2026', totalKm: 24, payout: 45.00, status: 'Completed' }
  ]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <FileText className="mr-2 text-brand-gold" size={20} />
          Prestations de Transport & Versements
        </h3>
        <p className="text-xs text-gray-500 mt-1">Archive de vos facturations logistiques transférées sur votre compte bancaire.</p>
      </div>

      <div className="space-y-4 text-xs">
        {payments.map((p) => (
          <div key={p.id} className="border border-gray-150 rounded-xl p-5 flex justify-between items-center hover:bg-gray-50/20 transition-colors">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">ID TRANSACTION : {p.id}</span>
              <p className="font-bold text-brand-dark mt-0.5">Prestation de livraison du {p.date}</p>
              <p className="text-gray-500 font-semibold">{p.totalKm} km parcourus au total</p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-base font-extrabold text-brand-green">{p.payout.toFixed(2)} €</p>
              <button
                onClick={() => alert(`Preuve de virement logistique : ${p.id}`)}
                className="flex items-center text-[11px] text-brand-green font-bold hover:underline justify-end"
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

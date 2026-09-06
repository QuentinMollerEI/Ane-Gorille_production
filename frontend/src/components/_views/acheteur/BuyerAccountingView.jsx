import React, { useState } from 'react';
import { FileText, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BuyerAccountingView() {
  const [invoices] = useState([
    {
      id: 'FAC-2026-102',
      date: '02/09/2026',
      amount: 25.50,
      siretClient: '21310555400018',
      chorusCode: 'SERV-CANTINE',
      ejNumber: 'EJ-90184', // Numéro d'engagement obligatoire pour mairies
      status: 'TRANSMIS_CHORUS', // 'BROUILLON', 'TRANSMIS_CHORUS', 'PAYE'
      chorusResponseId: 'CHR-9284102'
    }
  ]);

  const handleManualExport = (invoiceId) => {
    alert(`Génération du format réglementaire Factur-X (Fichier PDF/A-3 intégrant les données XML conformes Chorus Pro) pour l'ID : ${invoiceId}`);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <FileText className="mr-2 text-brand-gold" size={20} />
          Archive & Comptabilité Administrative
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Téléchargez vos factures conformes et suivez vos flux de facturation électronique (B2G / Chorus Pro).
        </p>
      </div>

      <div className="space-y-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="border border-gray-150 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h4 className="font-bold text-brand-dark">Facture {inv.id}</h4>
                <p className="text-[11px] text-gray-400">Date d'émission : {inv.date}</p>
              </div>
              <span className="text-base font-extrabold text-brand-green">{inv.amount.toFixed(2)} €</span>
            </div>

            {/* Bloc Spécifications Métiers B2G (Chorus Pro) */}
            <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase">SIRET Destinataire</p>
                <p className="font-mono mt-0.5 text-brand-dark">{inv.siretClient}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Code Service</p>
                <p className="font-semibold mt-0.5 text-brand-dark">{inv.chorusCode}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Engagement (EJ)</p>
                <p className="font-mono mt-0.5 text-brand-dark">{inv.ejNumber}</p>
              </div>
            </div>

            {/* Suivi du traitement Chorus Pro */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="text-brand-green" size={16} />
                <span className="font-semibold text-brand-green">Télétransmise à Chorus Pro</span>
                <span className="text-[10px] text-gray-400 font-mono">(ID: {inv.chorusResponseId})</span>
              </div>
              <button
                onClick={() => handleManualExport(inv.id)}
                className="px-3 py-1.5 bg-white border border-gray-250 text-gray-600 hover:text-brand-green hover:border-brand-green font-bold rounded-lg transition-colors"
              >
                Exporter Factur-X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

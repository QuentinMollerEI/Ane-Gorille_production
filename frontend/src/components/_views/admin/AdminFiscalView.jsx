import React, { useState } from 'react';
import { Shield, Coins, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminFiscalView() {
  const [metrics] = useState({
    platformRevenue: 138.39, // Commission cumulée
    totalTransacted: 1383.89,
    chorusSuccessRate: '100% (24 factures)',
    stripePending: 124.50
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <Shield className="mr-2 text-brand-gold" size={20} />
          Surveillance Fiscale, Stripe & Flux Chorus Pro
        </h3>
        <p className="text-xs text-gray-500 mt-1">Supervisez la conformité des transactions financières et le reversement automatique des fonds.</p>
      </div>

      {/* Cartes financières d'audit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <p className="text-gray-400 font-semibold uppercase">Total des transactions</p>
          <p className="text-xl font-extrabold text-brand-dark">{metrics.totalTransacted.toFixed(2)} €</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <p className="text-gray-400 font-semibold uppercase">Commissions de la plateforme</p>
          <p className="text-xl font-extrabold text-brand-green">{metrics.platformRevenue.toFixed(2)} €</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <p className="text-gray-400 font-semibold uppercase">Succès Chorus Pro</p>
          <p className="text-xl font-extrabold text-brand-dark">{metrics.chorusSuccessRate}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <p className="text-gray-400 font-semibold uppercase">Stripe Connect en transit</p>
          <p className="text-xl font-extrabold text-brand-gold">{metrics.stripePending.toFixed(2)} €</p>
        </div>
      </div>

      {/* Message d'audit fiscal */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-950 flex items-start space-x-3">
        <Coins className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-bold">Déclarations administratives automatiques conformes (Loi de lutte contre la fraude)</p>
          <p className="text-emerald-800 mt-1">
            Les données fiscales de l'exercice en cours sont prêtes pour la télétransmission obligatoire annuelle à la Direction Générale des Finances Publiques (DGFiP).
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ShoppingBag, CreditCard, FileCheck2, Download, ExternalLink } from 'lucide-react';

export default function BuyerView({ user }) {
  // Données fictives basées sur les spécifications Stripe Connect et Chorus Pro du projet
  const orders = [
    {
      id: 'BC-2026-801',
      producer: 'Producteur de la Rosée',
      amount: 450.00,
      date: '02/09/2026',
      status: 'En cours de livraison',
      paymentTerms: '30 jours fin de mois',
      invoiceType: 'Chorus Pro (Public)' // Exemple pour acheteur public
    },
    {
      id: 'BC-2026-789',
      producer: 'Vergers Âne & Gorille',
      amount: 185.50,
      date: '15/08/2026',
      status: 'Livré',
      paymentTerms: 'Comptant (Stripe Connect)',
      invoiceType: 'Standard'
    }
  ];

  const handleStripePayment = (orderId) => {
    alert(`Redirection sécurisée vers Stripe Connect pour la commande : ${orderId}`);
  };

  const handleChorusExport = (orderId) => {
    alert(`Transmission automatique de la facture au portail Chorus Pro pour traitement réglementaire.`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-brand-green flex items-center">
          <ShoppingBag size={20} className="mr-2 text-brand-gold" />
          Suivi de mes commandes et Facturation
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Suivez vos achats en direct et gérez vos règlements Stripe Connect ainsi que vos factures publiques et privées.
        </p>
      </div>

      {/* Liste des Commandes & Factures */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Historique des transactions</h3>

        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 border border-gray-100 rounded-xl hover:border-brand-gold transition-all bg-white flex flex-col md:flex-row md:items-center justify-between">

              {/* Détails Commande */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-gray-400">{order.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand-green border border-gray-100">
                    {order.status}
                  </span>
                </div>
                <h4 className="font-bold text-base text-brand-dark">{order.producer}</h4>
                <p className="text-xs text-gray-500">Commandé le {order.date} • Conditions : {order.paymentTerms}</p>
              </div>

              {/* Actions & Paiements */}
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end space-y-3">
                <span className="text-xl font-extrabold text-brand-green">
                  {order.amount.toFixed(2)} €
                </span>

                <div className="flex space-x-2">
                  {/* Option Export Chorus Pro si concerné */}
                  {order.invoiceType.includes('Chorus') && (
                    <button
                      onClick={() => handleChorusExport(order.id)}
                      className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                      title="Déposer sur Chorus Pro"
                    >
                      <ExternalLink size={14} className="mr-1.5" />
                      Chorus Pro
                    </button>
                  )}

                  {/* Bouton de paiement Stripe si non payé */}
                  {order.status !== 'Livré' ? (
                    <button
                      onClick={() => handleStripePayment(order.id)}
                      className="flex items-center bg-brand-green text-white hover:bg-opacity-95 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      <CreditCard size={14} className="mr-1.5" />
                      Régler
                    </button>
                  ) : (
                    <button
                      className="flex items-center bg-gray-50 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-100 cursor-not-allowed"
                      disabled
                    >
                      <FileCheck2 size={14} className="mr-1.5" />
                      Facture Acquittée
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

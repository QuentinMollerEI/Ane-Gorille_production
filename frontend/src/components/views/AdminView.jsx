import React, { useState } from 'react';
import { Shield, DollarSign, HeartPulse, MessageSquare, AlertTriangle, Check, X } from 'lucide-react';

export default function AdminView({ user }) {
  // Simulation des alertes système (HACCP et Transactions)
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'haccp', message: "Température critique détectée sur la tournée TR-2026-901 : 9.2°C (Cible max : 8°C)", severity: 'high' },
    { id: 2, type: 'fiscal', message: "Échec de synchronisation Chorus Pro pour la facture FAC-2026-102 (SIRET invalide)", severity: 'medium' }
  ]);

  // Simulation des produits en attente de modération pour la boutique
  const [pendingProducts, setPendingProducts] = useState([
    { id: 101, title: "Fraises Gariguette de la Rosée", producer: "Producteur de la Rosée", price: "5.50 €/kg" }
  ]);

  const handleResolveAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    alert("L'alerte a été marquée comme résolue.");
  };

  const handleModerateProduct = (id, approved) => {
    setPendingProducts(prev => prev.filter(p => p.id !== id));
    alert(approved ? "Produit approuvé et mis en ligne !" : "Produit rejeté.");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-brand-green flex items-center">
          <Shield size={20} className="mr-2 text-brand-gold" />
          Console d'Administration & Supervision
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Surveillez l'activité fiscale de Stripe Connect, modérez le catalogue et traitez les alertes sanitaires HACCP en temps réel.
        </p>
      </div>

      {/* Section 1 : Alertes Système Prioritaires */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-600 flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            Alertes système nécessitant une action ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-100 text-red-950'
                    : 'bg-amber-50 border-amber-100 text-amber-950'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="mt-0.5 text-red-500">
                    {alert.type === 'haccp' ? <HeartPulse size={18} /> : <DollarSign size={18} />}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{alert.type}</p>
                    <p className="text-sm font-medium mt-0.5">{alert.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm"
                >
                  Résoudre
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2 : Modération des Produits (Mise en rayon) */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Produits en attente de validation</h3>
        {pendingProducts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Aucun produit en attente de modération.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingProducts.map((product) => (
              <div key={product.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-brand-dark">{product.title}</h4>
                  <p className="text-xs text-gray-500">Proposé par : {product.producer} • Tarif : {product.price}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleModerateProduct(product.id, false)}
                    className="p-1.5 rounded-lg bg-white border border-gray-250 text-red-600 hover:bg-red-50 transition-colors"
                    title="Rejeter"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => handleModerateProduct(product.id, true)}
                    className="p-1.5 rounded-lg bg-brand-green text-white hover:bg-opacity-95 transition-all shadow-sm"
                    title="Approuver"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3 : Activité de support & Messagerie */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tickets d'assistance récents</h3>
        <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-gray-600">
            <MessageSquare size={16} className="text-brand-green" />
            <span>Acheteur (Mairie de Toulouse) : Demande d'assistance pour le portail Chorus Pro.</span>
          </div>
          <span className="text-brand-gold font-bold">En attente</span>
        </div>
      </div>
    </div>
  );
}

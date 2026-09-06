import React, { useState } from 'react';
import { ListOrdered, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';

export default function BuyerOrdersView() {
  const [orders] = useState([
    {
      id: 'CMD-2026-89',
      date: '02/09/2026',
      total: 25.50,
      status: 'preparation', // 'preparation', 'livraison', 'livre'
      items: [
        { name: 'Pommes de terre de la Rosée', qty: '2.5 kg', price: 6.25 },
        { name: 'Pommes Gala croquantes', qty: '5.0 kg', price: 19.25 }
      ],
      deliveryAddress: 'Cantine Municipale - 1 Place du Capitole, 31000 Toulouse',
      driverName: 'Jean-Pierre (LogiVert)'
    }
  ]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <ListOrdered className="mr-2 text-brand-gold" size={20} />
          Suivi de vos commandes en cours
        </h3>
        <p className="text-xs text-gray-500 mt-1">Consultez en temps réel l'avancement de vos approvisionnements alimentaires.</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-150 rounded-xl p-5 hover:shadow-md transition-shadow space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">{order.date}</span>
                <h4 className="font-bold text-brand-dark">{order.id}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-brand-green">{order.total.toFixed(2)} €</span>
                {order.status === 'preparation' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
                    <Clock size={12} className="mr-1" /> En cours de préparation
                  </span>
                )}
              </div>
            </div>

            {/* État d'avancement graphique */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-400 relative">
              <div className="text-brand-green">
                <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center mx-auto mb-1">1</div>
                Préparation
              </div>
              <div className={order.status !== 'preparation' ? 'text-brand-green' : ''}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${order.status !== 'preparation' ? 'bg-brand-green text-white' : 'bg-gray-200'}`}>2</div>
                En Transit
              </div>
              <div className={order.status === 'livre' ? 'text-brand-green' : ''}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 ${order.status === 'livre' ? 'bg-brand-green text-white' : 'bg-gray-200'}`}>3</div>
                Livré
              </div>
            </div>

            {/* Détails des articles */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-gray-500 uppercase tracking-wider">Détail du panier</p>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-gray-700">
                  <span>{item.name} (x{item.qty})</span>
                  <span className="font-semibold">{item.price.toFixed(2)} €</span>
                </div>
              ))}
            </div>

            {/* Adresse et Livraison */}
            <div className="text-xs text-gray-600 space-y-1.5 pt-2">
              <p className="flex items-center"><MapPin size={14} className="mr-2 text-gray-400" /> {order.deliveryAddress}</p>
              <p className="flex items-center"><Truck size={14} className="mr-2 text-gray-400" /> Livreur assigné : {order.driverName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

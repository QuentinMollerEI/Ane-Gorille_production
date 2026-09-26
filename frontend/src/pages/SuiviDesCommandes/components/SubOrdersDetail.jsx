import React from 'react';
import { Store, Thermometer, Tag } from 'lucide-react';

export function SubOrdersDetail({ subOrders = [] }) {
  if (!subOrders || subOrders.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-500">
        Aucune sous-commande enregistrée.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
        <Store size={16} className="text-emerald-700" />
        Détail par Producteur &amp; Artisan ({subOrders.length} colis)
      </h3>

      <div className="space-y-4">
        {subOrders.map((sub, idx) => (
          <div key={sub.subOrderId || idx} className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-slate-600" />
                <span className="font-black text-xs text-slate-900">{sub.vendorName || sub.vendorCompany || 'Vendeur Local'}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full">
                  SIRET : {sub.vendorSiret || '-'}
                </span>
              </div>

              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                sub.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                {sub.status || 'En attente'}
              </span>
            </div>

            <div className="space-y-2">
              {(sub.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{item.name || item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      {item.batchNumber && (
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                          <Tag size={10} /> Lot: {item.batchNumber}
                        </span>
                      )}
                      {item.temperatureRequirement && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded">
                          <Thermometer size={10} /> {item.temperatureRequirement}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <p className="font-bold text-slate-900">{(item.price * item.quantity).toFixed(2)} € HT</p>
                    <p className="text-[10px] text-slate-400">{item.quantity} x {item.price} €</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-bold text-slate-700 border-t border-slate-100">
              <span>Sous-total Colis HT :</span>
              <span className="font-mono text-slate-900 font-black">
                {(sub.subtotalHT || 0).toFixed(2)} € HT
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

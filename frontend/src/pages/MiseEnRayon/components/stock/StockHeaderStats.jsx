import React from 'react';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

export function StockHeaderStats({ products }) {
  const totalItems = products.length;
  const outOfStock = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStock = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5)).length;
  const totalValueHT = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 bg-slate-200 text-slate-800 rounded-xl">
          <Package size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Références</p>
          <p className="text-lg font-black text-slate-900">{totalItems}</p>
        </div>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 bg-emerald-200 text-emerald-800 rounded-xl">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Valeur Stock HT</p>
          <p className="text-lg font-black text-emerald-950 font-mono">{totalValueHT.toFixed(2)} €</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 bg-amber-200 text-amber-800 rounded-xl">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-amber-800 uppercase">Stock Faible</p>
          <p className="text-lg font-black text-amber-950">{lowStock}</p>
        </div>
      </div>

      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
        <div className="p-2.5 bg-rose-200 text-rose-800 rounded-xl">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-rose-800 uppercase">Rupture Stock</p>
          <p className="text-lg font-black text-rose-950">{outOfStock}</p>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Edit2, Plus, Minus, Archive, Eye, EyeOff } from 'lucide-react';

export function StockTable({ products, onQuickStockChange, onEditProduct, onToggleActive, onDeleteProduct }) {
  if (!products || products.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs font-bold">
        Aucun produit ne correspond aux critères de recherche.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <th className="py-3 px-4">Référence / Produit</th>
            <th className="py-3 px-4">Univers</th>
            <th className="py-3 px-4 text-right">Prix Vendeur HT</th>
            <th className="py-3 px-4 text-center">Niveau de Stock</th>
            <th className="py-3 px-4 text-center">Statut Visibilité</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800 bg-white">
          {products.map((item) => {
            const stock = item.stock || 0;
            const minStock = item.minStock || 5;
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= minStock;

            return (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-black text-slate-900">{item.title || item.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    Origine : {item.origin || 'Saint-Rémy-sur-Avre'} • TVA : {((item.tvaRate || 0.055) * 100).toFixed(1)} %
                  </p>
                </td>

                <td className="py-3 px-4">
                  {item.universe === 'GORILLE' || item.category === 'artisanat' ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black">
                      🦍 Gorille (Artisanat)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-black">
                      🥦 Âne (Maraîchage)
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {(item.price || 0).toFixed(2)} € <span className="text-[10px] text-slate-400 font-normal">/ {item.unit || 'kg'}</span>
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onQuickStockChange(item.id, stock - 1)}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer"
                      title="Diminuer le stock (-1)"
                    >
                      <Minus size={12} />
                    </button>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-800'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {stock} {item.unit || 'kg'}
                    </span>

                    <button
                      onClick={() => onQuickStockChange(item.id, stock + 1)}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer"
                      title="Augmenter le stock (+1)"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </td>

                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onToggleActive(item.id, !item.isActive)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                      item.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {item.isActive !== false ? (
                      <>
                        <Eye size={12} /> Actif
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} /> Inactif
                      </>
                    )}
                  </button>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEditProduct(item)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                      title="Éditer le produit"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => onDeleteProduct(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Archiver la référence"
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
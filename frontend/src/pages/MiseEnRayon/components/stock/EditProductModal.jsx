import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';

export function EditProductModal({ product, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    unit: 'kg',
    tvaRate: 0.055,
    stock: 0,
    minStock: 5,
    origin: '28350 Saint-Rémy-sur-Avre',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || product.name || '',
        price: product.price || 0,
        unit: product.unit || 'kg',
        tvaRate: product.tvaRate !== undefined ? product.tvaRate : 0.055,
        stock: product.stock !== undefined ? product.stock : 0,
        minStock: product.minStock || 5,
        origin: product.origin || '28350 Saint-Rémy-sur-Avre',
        description: product.description || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product.id, {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      minStock: parseInt(formData.minStock, 10) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Package size={18} className="text-emerald-700" />
            Édition Référence Stock
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div>
            <label className="text-[10px] uppercase text-slate-600 block mb-1">Nom du produit / Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Prix Vendeur HT (€) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Unité de Vente *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 cursor-pointer"
              >
                <option value="kg">au Kilogramme (kg)</option>
                <option value="pièce">à la Pièce</option>
                <option value="botte">à la Botte</option>
                <option value="cagette">à la Cagette</option>
                <option value="lot">au Lot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Stock Disponible *</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Seuil d'Alerte Min *</label>
              <input
                type="number"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Taux de TVA *</label>
              <select
                value={formData.tvaRate}
                onChange={(e) => setFormData({ ...formData, tvaRate: parseFloat(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 cursor-pointer"
              >
                <option value={0.055}>5,5 % (Produit Alimentaire Brut)</option>
                <option value={0.20}>20,0 % (Artisanat &amp; Transformé)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-600 block mb-1">Origine / Territoire</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Saint-Rémy-sur-Avre"
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-600 block mb-1">Description courte de la référence</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Variété, conseils de conservation ou spécificités d'artisanat..."
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-slate-800">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="accent-emerald-700 w-4 h-4"
            />
            <span>Référence active et visible sur le catalogue public</span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={16} />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
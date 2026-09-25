import React from "react";
import { Package, Image as ImageIcon } from "lucide-react";

export default function ProductIdentityFields({ formData, handleChange }) {
  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Package size={16} className="text-emerald-600" />
        Identité & Visuel du Produit
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Désignation Produit *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Tomates Marmande Bio, Miel d'Acacia 500g..."
            required
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Catégorie *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="maraichage">🌱 Maraîchage / Produits Frais (Âne)</option>
            <option value="artisanat">🪵 Artisanat / Non-Alimentaire (Gorille)</option>
            <option value="epicerie">🍯 Épicerie Fine & Transformés</option>
            <option value="boissons">🥤 Boissons & Jus</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Unité de Vente *</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="kg">Kilogramme (kg)</option>
            <option value="caisse">Caisse / Bocal</option>
            <option value="colis">Colis / Bocal carton</option>
            <option value="unité">Unité / Pièce</option>
            <option value="litre">Litre (L)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
            <ImageIcon size={12} className="text-slate-500" />
            URL de la Photo
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://domaine.com/photo.jpg"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-700 uppercase">Description Produit</label>
        <textarea
          name="description"
          rows={2}
          value={formData.description}
          onChange={handleChange}
          placeholder="Variété, conseils de conservation, caractéristiques organoleptiques..."
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>
    </div>
  );
}
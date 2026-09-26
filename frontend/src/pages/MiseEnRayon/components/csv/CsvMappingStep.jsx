import React from 'react';
import { ArrowRight, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export function CsvMappingStep({ headers, mapping, onMappingChange, onConfirmMapping, onCancel }) {
  const fieldsConfig = [
    { key: 'title', label: 'Titre / Nom du Produit *', required: true },
    { key: 'price', label: 'Prix Vendeur HT (€) *', required: true },
    { key: 'unit', label: 'Unité de vente (kg, pièce, botte...)', required: false },
    { key: 'stock', label: 'Stock Initial', required: false },
    { key: 'minStock', label: 'Seuil Alerte Stock Min', required: false },
    { key: 'tvaRate', label: 'Taux TVA (5,5% ou 20%)', required: false },
    { key: 'universe', label: 'Univers (Âne / Gorille)', required: false },
    { key: 'origin', label: 'Origine / Provenance', required: false },
    { key: 'description', label: 'Description', required: false }
  ];

  const isValid = mapping.title && mapping.price;

  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-700" size={20} />
            Étape 2 : Correspondance des Colonnes CSV
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Associez chaque champ de la plateforme avec les en-têtes détectées dans votre fichier.
          </p>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full">
          {headers.length} colonnes trouvées
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
        {fieldsConfig.map((field) => (
          <div key={field.key} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1.5">
            <label className="text-[10px] uppercase text-slate-700 font-black flex items-center justify-between">
              <span>{field.label}</span>
              {field.required && <span className="text-rose-600 font-bold">* Obligatoire</span>}
            </label>
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => onMappingChange(field.key, e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Ignorer ou valeur par défaut --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  Colonne CSV : "{h}"
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={onConfirmMapping}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>Valider le Mapping & Prévisualiser</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
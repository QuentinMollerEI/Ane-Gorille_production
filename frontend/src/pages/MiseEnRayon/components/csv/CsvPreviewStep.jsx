import React from 'react';
import { CheckCircle2, AlertTriangle, UploadCloud, RefreshCw, XCircle } from 'lucide-react';

export function CsvPreviewStep({ parsedRows, onImportValidRows, isImporting, onReset }) {
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="text-emerald-700" size={20} />
            Étape 3 : Validation de Masse & Prévisualisation
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Vérifiez les données importées avant d'injecter les références valides dans votre stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} /> {validCount} Valide{validCount > 1 ? 's' : ''}
          </span>
          {invalidCount > 0 && (
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full flex items-center gap-1">
              <AlertTriangle size={12} /> {invalidCount} Erreur{invalidCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs max-h-96">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Titre / Produit</th>
              <th className="py-3 px-4 text-right">Prix HT</th>
              <th className="py-3 px-4 text-center">Stock</th>
              <th className="py-3 px-4 text-center">Univers</th>
              <th className="py-3 px-4 text-center">TVA</th>
              <th className="py-3 px-4">Anomalies / Diagnostic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
            {parsedRows.map((row, idx) => (
              <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}>
                <td className="py-3 px-4">
                  {row.isValid ? (
                    <span className="text-emerald-700 font-black flex items-center gap-1 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} /> Prêt
                    </span>
                  ) : (
                    <span className="text-rose-700 font-black flex items-center gap-1 text-[10px] bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                      <XCircle size={12} /> Rejeté
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 font-black text-slate-900">
                  {row.data.title || <span className="text-slate-400 italic">Non renseigné</span>}
                </td>

                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {row.data.price ? `${row.data.price.toFixed(2)} €` : '-'}
                  <span className="text-[10px] text-slate-400 block font-normal">/ {row.data.unit}</span>
                </td>

                <td className="py-3 px-4 text-center font-mono font-bold">
                  {row.data.stock}
                </td>

                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    row.data.universe === 'GORILLE' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {row.data.universe === 'GORILLE' ? '🦍 Gorille' : '🥦 Âne'}
                  </span>
                </td>

                <td className="py-3 px-4 text-center font-mono">
                  {(row.data.tvaRate * 100).toFixed(1)} %
                </td>

                <td className="py-3 px-4 text-rose-700 text-[11px]">
                  {row.errors.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5">
                      {row.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-emerald-700 font-normal">Données certifiées</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} /> Recommencer
        </button>

        <button
          type="button"
          disabled={validCount === 0 || isImporting}
          onClick={onImportValidRows}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <UploadCloud size={18} />
          <span>Injecter {validCount} Référence{validCount > 1 ? 's' : ''} dans le Stock</span>
        </button>
      </div>
    </div>
  );
}
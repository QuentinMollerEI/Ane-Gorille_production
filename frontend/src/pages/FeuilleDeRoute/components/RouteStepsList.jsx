import React from 'react';
import { Package, Truck, CheckCircle2, MapPin, PenTool, Thermometer } from 'lucide-react';

export function RouteStepsList({ steps = [], onSelectStepForPod, selectedStepId }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center text-xs font-bold text-slate-500">
        Aucune étape planifiée dans cette feuille de route.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Truck size={18} className="text-emerald-700" />
          Ordre de Passage de la Ramasse &amp; Livraison ({steps.length} points)
        </span>
      </h3>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'COMPLETED';
          const isRamasse = step.type === 'RAMASSE';
          const fullAddress = [step.address, step.postalCode, step.city].filter(Boolean).join(', ');

          return (
            <div
              key={step.id || idx}
              className={`p-5 rounded-3xl border transition-all space-y-3 ${
                isCompleted
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : step.id === selectedStepId
                  ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                    isCompleted
                      ? 'bg-emerald-200 text-emerald-950'
                      : isRamasse
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}>
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isRamasse ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {isRamasse ? '📦 RAMASSE PRODUCTEUR' : '🚚 LIVRAISON CLIENT'}
                      </span>
                      <h4 className="font-black text-xs text-slate-900">{step.clientName || step.vendorName || `Étape #${idx + 1}`}</h4>
                    </div>
                    {fullAddress && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin size={12} className="text-slate-400" /> {fullAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> Émargé (POD)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectStepForPod(step)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PenTool size={14} />
                      <span>Émarger (POD)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 border border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Package size={12} /> {step.itemsCount ?? (step.items || []).length} colis / conditionnements
                  </span>
                  {step.temperatureRequirement && (
                    <span className="flex items-center gap-1 text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded">
                      <Thermometer size={12} /> {step.temperatureRequirement}
                    </span>
                  )}
                </div>
                {step.notes && (
                  <p className="text-[11px] text-slate-600 font-medium italic pt-1 border-t border-slate-200">
                    " {step.notes} "
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
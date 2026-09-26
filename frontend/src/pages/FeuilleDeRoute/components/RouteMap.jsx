import React from 'react';
import { Navigation, Truck } from 'lucide-react';

export function RouteMap({ steps = [], selectedStepId, onSelectStep, hubLocation }) {
  const hubName = hubLocation?.name || "Hub Principal";
  const hubAddress = hubLocation?.address || "";

  return (
    <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-emerald-400">
          <Navigation size={18} />
          Cartographie de la Tournée
        </h3>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono px-2.5 py-0.5 rounded-full font-bold">
          GPS VUL Actif
        </span>
      </div>

      <div className="relative w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        {hubLocation && (
          <div className="relative z-10 flex items-center gap-2 bg-emerald-900/80 backdrop-blur-xs border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs w-fit">
            <Truck size={16} className="text-emerald-400" />
            <div>
              <p className="font-black leading-none">{hubName}</p>
              {hubAddress && <p className="text-[9px] text-emerald-300 opacity-80">{hubAddress}</p>}
            </div>
          </div>
        )}

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2 my-auto">
          {steps.map((step, idx) => {
            const isSelected = step.id === selectedStepId;
            return (
              <button
                key={step.id || idx}
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-102'
                    : step.status === 'COMPLETED'
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-black">Étape {idx + 1} ({step.type === 'RAMASSE' ? '📦 Ramasse' : '🚚 Livraison'})</span>
                  {step.status === 'COMPLETED' && <span className="text-emerald-400 font-bold">✓ Émargé</span>}
                </div>
                <p className="font-bold text-xs truncate mt-0.5">{step.clientName || step.vendorName || `Étape #${idx + 1}`}</p>
                <p className="text-[9px] text-slate-400 truncate">
                  {[step.address, step.postalCode, step.city].filter(Boolean).join(', ')}
                </p>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
          <span>Suivi télématique en temps réel</span>
          <span>{steps.filter(s => s.status === 'COMPLETED').length} / {steps.length} étapes effectuées</span>
        </div>
      </div>
    </div>
  );
}
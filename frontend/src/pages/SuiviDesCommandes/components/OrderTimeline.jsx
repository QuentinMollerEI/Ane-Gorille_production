import React from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

export function OrderTimeline({ status, timelineEvents = [] }) {
  const steps = [
    { key: 'PENDING', label: 'Commande Validée', icon: Clock },
    { key: 'PREPARING', label: 'En Préparation HACCP', icon: CheckCircle2 },
    { key: 'IN_TRANSIT', label: 'En Cours de Livraison VUL', icon: Truck },
    { key: 'DELIVERED', label: 'Livré & Émargé POD', icon: PackageCheck }
  ];

  const getStepStatus = (stepKey) => {
    const statusOrder = ['PENDING', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (status === 'CANCELLED') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
        <Clock size={16} className="text-emerald-700" />
        Suivi Chronologique de la Commande
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative pt-2">
        {steps.map((step) => {
          const stepState = getStepStatus(step.key);
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center sm:flex-col sm:text-center gap-3 ${
                stepState === 'completed'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : stepState === 'current'
                  ? 'bg-slate-900 border-slate-900 text-white font-black shadow-md'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  stepState === 'completed'
                    ? 'bg-emerald-200 text-emerald-900'
                    : stepState === 'current'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon size={18} />
              </div>

              <div>
                <p className="text-xs font-bold leading-tight">{step.label}</p>
                <p className="text-[10px] opacity-75 mt-0.5">
                  {stepState === 'completed'
                    ? 'Étape validée'
                    : stepState === 'current'
                    ? 'En cours'
                    : 'À venir'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {status === 'CANCELLED' && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>Commande annulée.</span>
        </div>
      )}
    </div>
  );
}

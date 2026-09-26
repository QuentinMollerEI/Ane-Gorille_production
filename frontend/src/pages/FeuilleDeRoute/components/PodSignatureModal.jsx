import React, { useState } from 'react';
import { X, ShieldCheck, Thermometer, PenTool, Loader2 } from 'lucide-react';

export function PodSignatureModal({ step, isOpen, onClose, onConfirmPod }) {
  const [signerName, setSignerName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [reserveNotes, setReserveNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !step) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!signerName.trim()) return;

    setIsSubmitting(true);
    onConfirmPod(step.id, {
      signerName: signerName.trim(),
      measuredTemperature: temperature ? parseFloat(temperature) : null,
      reserveNotes: reserveNotes.trim(),
      signedAt: new Date().toISOString()
    });
    setIsSubmitting(false);
  };

  const fullAddress = [step.address, step.postalCode, step.city].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <PenTool size={18} className="text-emerald-700" />
            Émargement &amp; Preuve de Livraison (POD)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-black">Étape d'Émargement :</p>
            <p className="text-sm font-black text-slate-900">{step.clientName || step.vendorName || `Étape #${step.id}`}</p>
            {fullAddress && <p className="text-[11px] text-slate-600 font-medium">{fullAddress}</p>}
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-700 block mb-1 font-black">
              Nom &amp; Prénom du Réceptionnaire *
            </label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Nom et prénom du réceptionnaire"
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-700 block mb-1 font-black flex items-center gap-1">
                <Thermometer size={14} className="text-blue-700" />
                Température Frigo (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Ex: 4.0"
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
              />
            </div>

            <div className="flex items-end pb-1 text-[10px] text-blue-900 font-semibold leading-tight">
              Relevé de température de la chaîne du froid HACCP à la livraison.
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-700 block mb-1 font-black">
              Observations ou Réserves éventuelles
            </label>
            <textarea
              rows={2}
              value={reserveNotes}
              onChange={(e) => setReserveNotes(e.target.value)}
              placeholder="Remarques lors de la réception..."
              className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-700 block mb-1 font-black">
              Signature Tactile Réceptionnaire (POD)
            </label>
            <div className="h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-normal italic">
              [ Zone de signature émargée ]
            </div>
          </div>

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
              disabled={isSubmitting || !signerName.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Valider l'Émargement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
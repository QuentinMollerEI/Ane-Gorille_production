import React, { useState } from 'react';
import { AlertCircle, Send, ShieldAlert } from 'lucide-react';

export function ClaimsSection({ orderId, claims = [], onSubmitClaim }) {
  const [showForm, setShowForm] = useState(false);
  const [claimType, setClaimType] = useState('TEMPERATURE');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    onSubmitClaim({
      orderId,
      claimType,
      description: description.trim(),
      createdAt: new Date().toISOString()
    });
    setDescription('');
    setShowForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert size={18} className="text-rose-700" />
          Espace Litiges &amp; Assurance Qualité HACCP
        </h3>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <AlertCircle size={14} />
          <span>{showForm ? 'Fermer le formulaire' : 'Déclarer un incident'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border border-rose-200 rounded-2xl space-y-3 text-xs">
          <p className="font-bold text-slate-800">Déclaration de non-conformité sur la commande :</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Motif du litige *</label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="TEMPERATURE">❄️ Rupture Chaîne du Froid (HACCP)</option>
                <option value="DAMAGED">📦 Produit Endommagé / Altéré</option>
                <option value="MISSING">🔍 Colis ou Produit Manquant</option>
                <option value="DELAY">⏱️ Retard de Livraison Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Description détaillée *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez le problème rencontré (ex: température mesurée à +12°C à la réception)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black uppercase tracking-wider text-[11px] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={14} />
            <span>Transmettre la réclamation au Support</span>
          </button>
        </form>
      )}

      {claims.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Historique des réclamations :</p>
          {claims.map((c, i) => (
            <div key={i} className="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-rose-800">{c.claimType}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-slate-700 font-medium">{c.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 italic">Aucune réclamation enregistrée sur cette commande.</p>
      )}
    </div>
  );
}

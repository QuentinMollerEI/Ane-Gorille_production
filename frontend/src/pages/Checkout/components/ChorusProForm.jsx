import React from "react";
import { Landmark, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export function ChorusProForm({ refEngagement, onRefEngagementChange, serviceCode, onServiceCodeChange, siretPublic, onSiretPublicChange, isValid }) {
  return (
    <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-blue-950 text-xs uppercase tracking-wider flex items-center gap-2">
          <Landmark size={18} className="text-blue-700" />
          Engagement Budgétaire B2G Chorus Pro (Mandat Public)
        </h4>
        {isValid ? (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
            <CheckCircle2 size={12} /> Référence Validée
          </span>
        ) : (
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
            Champ Obligatoire
          </span>
        )}
      </div>

      <p className="text-[11px] text-blue-900 font-medium leading-relaxed">
        Conformément à la réglementation sur la facturation publique électronique, la télétransmission de la facture Factur-X vers Chorus Pro nécessite l'enregistrement de votre numéro de bon de commande administratif.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black text-blue-900 uppercase block mb-1">
            N° d'Engagement Budgétaire / Bon de Commande (RefEngagement) *
          </label>

          <input
            type="text"
            required
            value={refEngagement}
            onChange={(e) => onRefEngagementChange(e.target.value)}
            placeholder="Ex: BC-2026-MAIRIE-0042"
            className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
              Code Service Destinataire (Optionnel)
            </label>
            <input
              type="text"
              value={serviceCode}
              onChange={(e) => onServiceCodeChange(e.target.value)}
              placeholder="Ex: SERV-CANTINE"
              className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
              SIRET Acheteur Public (Auto-rempli)
            </label>
            <input
              type="text"
              readOnly
              value={siretPublic || "-"}
              className="w-full p-2.5 bg-blue-100/50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-white border border-blue-200 rounded-2xl text-[10px] text-blue-950 flex items-center gap-2">
        <FileText size={16} className="text-blue-700 shrink-0" />
        <span>Règlement sous 30 jours via mandat administratif avec émission directe de la Factur-X sur Chorus Pro.</span>
      </div>
    </div>
  );
}
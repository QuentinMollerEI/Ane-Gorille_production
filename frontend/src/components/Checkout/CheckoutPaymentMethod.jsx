import React from "react";
import { Building2, CreditCard, FileText, ShieldCheck } from "lucide-react";

/**
 * 🔒 COMPOSANT : CheckoutPaymentMethod.jsx
 * Sélecteur dynamique des moyens de paiement selon le rôle utilisateur (B2G vs B2B/B2C)
 */
export default function CheckoutPaymentMethod({
  userRole = "b2b",
  selectedMethod,
  onMethodChange,
  engagementRef,
  onEngagementRefChange,
}) {
  const isB2G = userRole === "acheteur_public" || userRole === "b2g";
  const isB2B = userRole === "acheteur_prive" || userRole === "b2b";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100/60 pb-3">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={15} className="text-emerald-700 stroke-[1.4]" />
          <span>Mode de Règlement — {isB2G ? "Secteur Public (Chorus Pro)" : "Professionnel (B2B)"}</span>
        </h3>
        <span className="bg-amber-50 border border-amber-200/60 text-amber-900 text-[9px] font-semibold px-2 py-0.5 rounded-full">
          {isB2G ? "Mandat Public 30j" : "Conforme DSP2 & LME"}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* 🏛️ OPTION 1 : Mandat Administratif (Exclusif Acheteur Public / B2G) */}
        {isB2G && (
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              selectedMethod === "chorus_mandate"
                ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/50"
                : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="chorus_mandate"
              checked={selectedMethod === "chorus_mandate"}
              onChange={() => onMethodChange("chorus_mandate")}
              className="mt-0.5 text-emerald-800 focus:ring-emerald-500"
            />
            <div className="space-y-0.5 flex-1">
              <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-700 stroke-[1.4]" />
                Mandat Administratif (Chorus Pro — 30 jours)
              </span>
              <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                Facturation dématérialisée sous norme EN 16931. Virement par le Trésor Public à 30 jours après livraison.
              </p>
            </div>
          </label>
        )}

        {/* 💳 OPTION 2 : Carte Bancaire via Stripe (Réservé B2B / B2C) */}
        {!isB2G && (
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              selectedMethod === "stripe_card"
                ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/50"
                : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="stripe_card"
              checked={selectedMethod === "stripe_card"}
              onChange={() => onMethodChange("stripe_card")}
              className="mt-0.5 text-emerald-800 focus:ring-emerald-500"
            />
            <div className="space-y-0.5 flex-1">
              <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <CreditCard size={13} className="text-emerald-700 stroke-[1.4]" />
                Carte Bancaire Professionnelle (Stripe Connect)
              </span>
              <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                Règlement immédiat par Carte Bleue, Visa, Mastercard B2B sous protocole 3D Secure.
              </p>
            </div>
          </label>
        )}

        {/* 📄 OPTION 3 : Virement Bancaire à 30 jours (Acheteur Privé B2B) */}
        {isB2B && (
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              selectedMethod === "bank_transfer"
                ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/50"
                : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={selectedMethod === "bank_transfer"}
              onChange={() => onMethodChange("bank_transfer")}
              className="mt-0.5 text-emerald-800 focus:ring-emerald-500"
            />
            <div className="space-y-0.5 flex-1">
              <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-700 stroke-[1.4]" />
                Virement Bancaire (Échéance 30 jours — Loi LME)
              </span>
              <p className="text-[11px] text-gray-500 font-normal leading-relaxed">
                Génération immédiate d'un Bon de Commande (BC). Facture payable par virement à 30 jours post-livraison.
              </p>
            </div>
          </label>
        )}
      </div>

      {/* 📥 Champ obligatoire N° d'Engagement pour les Acheteurs Publics (Chorus Pro) */}
      {isB2G && selectedMethod === "chorus_mandate" && (
        <div className="p-3.5 bg-gray-50/80 border border-amber-200/60 rounded-xl space-y-1.5">
          <label className="text-[11px] font-bold text-gray-800 block">
            N° d'Engagement Budgétaire / Bon de Commande Public <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={engagementRef}
            onChange={(e) => onEngagementRefChange(e.target.value)}
            placeholder="Ex: ENG-2026-09871"
            required
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-amber-400 focus:outline-none"
          />
          <p className="text-[10px] text-gray-400">
            Cette référence figurera obligatoirement sur l'en-tête de la Factur-X soumise sur Chorus Pro.
          </p>
        </div>
      )}
    </div>
  );
}
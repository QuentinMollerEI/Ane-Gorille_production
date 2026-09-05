import React from "react";
import { Landmark } from "lucide-react";

export default function ChorusProForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Landmark size={16} className="text-blue-700" /> Données
        d'Identification et Facturation Chorus Pro
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Raison Sociale Officielle de l'Établissement *
          </label>
          <input
            type="text"
            value={profileData?.companyName || ""}
            onChange={(e) => onChange("companyName", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : Collège Jean Moulin (Cuisine Centrale)"
          />
          {errors?.companyName && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.companyName}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Numéro de SIRET Établissement (14 chiffres) *
          </label>
          <input
            type="text"
            maxLength="14"
            value={profileData?.siret || ""}
            onChange={(e) => onChange("siret", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : 12345678900012"
          />
          {errors?.siret && (
            <p className="text-red-600 text-[10px] font-bold">{errors.siret}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Numéro de TVA Intracommunautaire (Optionnel)
          </label>
          <input
            type="text"
            value={profileData?.vatNumber || ""}
            onChange={(e) => onChange("vatNumber", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : FR12345678901"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Code APE / NAF Établissement
          </label>
          <input
            type="text"
            maxLength="5"
            value={profileData?.apeCode || ""}
            onChange={(e) => onChange("apeCode", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : 5629B"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            E-mail de Facturation (Comptabilité / Service Factur-X) *
          </label>
          <input
            type="email"
            value={profileData?.billingEmail || ""}
            onChange={(e) => onChange("billingEmail", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="compta-cantine@mairie-ville.fr"
          />
          {errors?.billingEmail && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.billingEmail}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Nom de l'Ordonnateur / Intendant Responsable *
          </label>
          <input
            type="text"
            value={profileData?.billingDirectorName || ""}
            onChange={(e) => onChange("billingDirectorName", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : Mme. Christine Lagarde (Gestionnaire)"
          />
          {errors?.billingDirectorName && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.billingDirectorName}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Code Service Destinataire Chorus Pro (Si exigé)
          </label>
          <input
            type="text"
            value={profileData?.chorusServiceCode || ""}
            onChange={(e) => onChange("chorusServiceCode", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : CUISINE-01"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Numéro d'Engagement Juridique (EJ) Global *
          </label>
          <input
            type="text"
            value={profileData?.globalEngagementNumber || ""}
            onChange={(e) => onChange("globalEngagementNumber", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : EJ-2026-98124"
          />
          {errors?.globalEngagementNumber && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.globalEngagementNumber}
            </p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-blue-800 bg-blue-50 p-3.5 rounded-2xl border border-blue-150 font-medium leading-relaxed">
        ℹ️{" "}
        <strong>
          Réglementation de Facturation Publique (Chorus Pro B2G) :
        </strong>{" "}
        Conformément aux obligations administratives françaises, toute facture
        publique doit être émise sous le standard <strong>Factur-X</strong> et
        transmise de façon automatisée. Le numéro de SIRET et le numéro
        d'Engagement Juridique (EJ) sont des variables obligatoires de rejet par
        le trésor public.
      </p>
    </div>
  );
}

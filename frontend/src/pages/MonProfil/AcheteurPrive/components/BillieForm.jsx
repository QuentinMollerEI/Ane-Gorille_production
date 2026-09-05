import React from "react";
import { Building2, ShieldCheck } from "lucide-react";

export default function BillieForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Building2 size={16} className="text-green-700" /> Coordonnées et
        Mentions Fiscales B2B
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Raison Sociale ou Dénomination Commerciale *
          </label>
          <input
            type="text"
            value={profileData?.companyName || ""}
            onChange={(e) => onChange("companyName", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : Restaurant de la Paix"
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
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : 98765432100045"
          />
          {errors?.siret && (
            <p className="text-red-600 text-[10px] font-bold">{errors.siret}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Numéro de TVA Intracommunautaire *
          </label>
          <input
            type="text"
            value={profileData?.vatNumber || ""}
            onChange={(e) => onChange("vatNumber", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : FR45987654321"
          />
          {errors?.vatNumber && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.vatNumber}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            Code NAF / APE (Filiation d'activité)
          </label>
          <input
            type="text"
            maxLength="5"
            value={profileData?.apeCode || ""}
            onChange={(e) => onChange("apeCode", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="Ex : 5610A"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
            E-mail pour la réception des factures *
          </label>
          <input
            type="email"
            value={profileData?.billingEmail || ""}
            onChange={(e) => onChange("billingEmail", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
            placeholder="compta-resto@paix.fr"
          />
          {errors?.billingEmail && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.billingEmail}
            </p>
          )}
        </div>
      </div>

      <div className="bg-green-50/40 border border-green-200 p-5 rounded-2xl flex gap-3.5 items-start">
        <ShieldCheck className="text-green-700 shrink-0" size={20} />
        <div className="space-y-1 text-green-950">
          <h4 className="text-[11px] font-black uppercase tracking-wider">
            Paiement Garanti à 30 Jours (BNPL) via Billie
          </h4>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            Pour soutenir votre trésorerie, la plateforme d'
            <strong>Âne & Gorille</strong> intègre la solution d'affacturage
            professionnelle <strong>Billie</strong>. Lors de la validation de
            votre panier B2B, Billie interroge de manière sécurisée l'annuaire
            de solvabilité grâce à votre <strong>SIRET</strong> pour accorder un
            crédit acheteur à 30 jours, sans aucune formalité supplémentaire.
          </p>
        </div>
      </div>
    </div>
  );
}

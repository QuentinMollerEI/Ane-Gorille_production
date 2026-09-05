import React from "react";
import { Award } from "lucide-react";

/**
 * 🧑‍🌾 COMPOSANT : BioCertificationForm.jsx
 * Emplacement : src/pages/MonProfil/Producteur/components/BioCertificationForm.jsx
 * Responsabilité unique : Gérer les agréments d'Agriculture Biologique et de conformité de traçabilité d'État (EGAlim).
 */
export default function BioCertificationForm({
  profileData,
  onChange,
  errors,
}) {
  const isBio = Boolean(profileData?.isBio);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Award size={16} className="text-amber-700" /> Certifications
        Biologiques & Labellisation (EGAlim)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        {/* Sélecteur Oui/Non */}
        <div className="space-y-3 md:col-span-2">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
            Votre exploitation pratique-t-elle l'Agriculture Biologique ? *
          </span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-gray-700 font-bold">
              <input
                type="radio"
                name="isBio"
                checked={isBio}
                onChange={() => onChange("isBio", true)}
                className="text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>
                Oui, Certifiée Agriculture Biologique (Label AB / Eurofeuille)
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-gray-700 font-bold">
              <input
                type="radio"
                name="isBio"
                checked={!isBio}
                onChange={() => {
                  onChange("isBio", false);
                  onChange("bioCertificationNumber", "");
                  onChange("bioControlBody", "");
                  onChange("bioCertificateExpiry", "");
                }}
                className="text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Non, Agriculture Conventionnelle / Raisonnée</span>
            </label>
          </div>
        </div>

        {/* Champs spécifiques au Bio (Conditionnels) */}
        {isBio && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2 animate-slide-in">
            {/* Numéro d'Agrément */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">
                Numéro d'Agrément Agence Bio *
              </label>
              <input
                type="text"
                value={profileData?.bioCertificationNumber || ""}
                onChange={(e) =>
                  onChange("bioCertificationNumber", e.target.value)
                }
                className="w-full p-3 border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none bg-amber-50/10 font-mono"
                placeholder="Ex : CERT-BIO-90812"
              />
              {errors?.bioCertificationNumber && (
                <p className="text-red-600 text-[10px] font-bold">
                  {errors.bioCertificationNumber}
                </p>
              )}
            </div>

            {/* Organisme de Contrôle */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">
                Organisme certificateur (ex: Ecocert, Certipaq) *
              </label>
              <select
                value={profileData?.bioControlBody || ""}
                onChange={(e) => onChange("bioControlBody", e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none bg-amber-50/10 cursor-pointer"
              >
                <option value="">-- Sélectionner --</option>
                <option value="ecocert">Ecocert France (FR-BIO-01)</option>
                <option value="certipaq">Certipaq Bio (FR-BIO-09)</option>
                <option value="bureau_veritas">
                  Bureau Veritas Certification (FR-BIO-10)
                </option>
                <option value="sgs">SGS ICS (FR-BIO-20)</option>
              </select>
              {errors?.bioControlBody && (
                <p className="text-red-600 text-[10px] font-bold">
                  {errors.bioControlBody}
                </p>
              )}
            </div>

            {/* Date d'expiration */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">
                Date limite de validité du Certificat *
              </label>
              <input
                type="date"
                value={profileData?.bioCertificateExpiry || ""}
                onChange={(e) =>
                  onChange("bioCertificateExpiry", e.target.value)
                }
                className="w-full p-3 border border-amber-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none bg-amber-50/10 cursor-pointer"
              />
              {errors?.bioCertificateExpiry && (
                <p className="text-red-600 text-[10px] font-bold">
                  {errors.bioCertificateExpiry}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

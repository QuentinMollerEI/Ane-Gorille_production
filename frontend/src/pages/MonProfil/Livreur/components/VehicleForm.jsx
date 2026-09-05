import React from "react";
import { Truck, Scale, FileCheck } from "lucide-react";

/**
 * 🚛 COMPOSANT : VehicleForm.jsx
 * Emplacement : src/pages/MonProfil/Livreur/components/VehicleForm.jsx
 * Responsabilité unique : Gérer les données d'identification de l'entreprise et la fiche technique réglementaire du véhicule (HACCP / Gabarit).
 */
export default function VehicleForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-xs">
      {/* 1. DOCUMENTS LÉGAUX ET FISCAUX */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <FileCheck size={16} className="text-blue-700" /> Autorisations
          Légales & Fiscalité Logistique
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          {/* Dénomination Sociale */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Dénomination Sociale de l'Entreprise de Transport *
            </label>
            <input
              type="text"
              value={profileData?.companyName || ""}
              onChange={(e) => onChange("companyName", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : Alpes Logistique Circuit Court"
            />
            {errors?.companyName && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.companyName}
              </p>
            )}
          </div>

          {/* SIRET */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Numéro de SIRET Transporteur *
            </label>
            <input
              type="text"
              maxLength="14"
              value={profileData?.siret || ""}
              onChange={(e) => onChange("siret", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : 45678912300078"
            />
            {errors?.siret && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.siret}
              </p>
            )}
          </div>

          {/* TVA */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Numéro de TVA Intracommunautaire *
            </label>
            <input
              type="text"
              value={profileData?.vatNumber || ""}
              onChange={(e) => onChange("vatNumber", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : FR12456789123"
            />
            {errors?.vatNumber && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.vatNumber}
              </p>
            )}
          </div>

          {/* Licence de transport */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Numéro de Licence de Transport de Marchandises (DREAL) *
            </label>
            <input
              type="text"
              value={profileData?.transportLicense || ""}
              onChange={(e) => onChange("transportLicense", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : LIC-TRANS-2026-081"
            />
            {errors?.transportLicense && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.transportLicense}
              </p>
            )}
          </div>

          {/* Date de validité de la licence */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
              Date de Fin de Validité de la Licence *
            </label>
            <input
              type="date"
              value={profileData?.transportLicenseExpiry || ""}
              onChange={(e) =>
                onChange("transportLicenseExpiry", e.target.value)
              }
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer focus:border-blue-600"
            />
            {errors?.transportLicenseExpiry && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.transportLicenseExpiry}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. FICHE TECHNIQUE ET SÉCURITÉ ALIMENTAIRE */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <Scale size={16} className="text-blue-700" /> Fiche Technique Véhicule
          & Sécurité Sanitaire (HACCP)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          {/* Gabarit du Véhicule */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Gabarit du Véhicule Routier *
            </label>
            <select
              value={profileData?.vehicleGabarit || "fourgon"}
              onChange={(e) => onChange("vehicleGabarit", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white cursor-pointer focus:border-blue-600"
            >
              <option value="fourgon">
                Fourgonnette / Fourgon VL (&lt; 3.5 tonnes)
              </option>
              <option value="porteur">
                Camion Porteur Rigide PL (De 3.5t à 19t)
              </option>
              <option value="semi">Semi-remorque PL (&gt; 19t)</option>
            </select>
          </div>

          {/* Plaque d'immatriculation */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Plaque d'Immatriculation du Véhicule *
            </label>
            <input
              type="text"
              value={profileData?.vehiclePlate || ""}
              onChange={(e) =>
                onChange("vehiclePlate", e.target.value.toUpperCase())
              }
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : AA-123-AA"
            />
            {errors?.vehiclePlate && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.vehiclePlate}
              </p>
            )}
          </div>

          {/* Type de Froid */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
              Type de Froid Embarqué (HACCP) *
            </label>
            <select
              value={profileData?.coldType || "temp_ambiante"}
              onChange={(e) => onChange("coldType", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white cursor-pointer focus:border-blue-600"
            >
              <option value="temp_ambiante">
                Température Ambiante (Légumes standards)
              </option>
              <option value="frais_positif">
                Froid Positif Régulé (+2°C à +4°C) (Recommandé)
              </option>
              <option value="isotherme">Simple Caisson Isotherme</option>
            </select>
          </div>

          {/* Charge Utile Maximale */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Charge Utile Maximale (en kg) *
            </label>
            <input
              type="number"
              value={profileData?.maxLoadCapacity || ""}
              onChange={(e) =>
                onChange("maxLoadCapacity", Number(e.target.value))
              }
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : 1500"
            />
            {errors?.maxLoadCapacity && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.maxLoadCapacity}
              </p>
            )}
          </div>

          {/* Volume utile */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Volume Utile Utilisable (en m³) *
            </label>
            <input
              type="number"
              value={profileData?.volumeCapacity || ""}
              onChange={(e) =>
                onChange("volumeCapacity", Number(e.target.value))
              }
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
              placeholder="Ex : 12"
            />
            {errors?.volumeCapacity && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.volumeCapacity}
              </p>
            )}
          </div>

          {/* Attestation Sanitaire */}
          <div className="space-y-3 flex items-end pb-3 md:col-span-3">
            <label className="flex items-center gap-3 cursor-pointer select-none text-gray-700 font-bold">
              <input
                type="checkbox"
                checked={Boolean(profileData?.hasSanitaryCertificate)}
                onChange={(e) =>
                  onChange("hasSanitaryCertificate", e.target.checked)
                }
                className="text-blue-600 focus:ring-blue-500 rounded w-4 h-4 cursor-pointer"
              />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Je certifie détenir à bord du véhicule l'attestation de
                nettoyage sanitaire réglementaire (HACCP) *
              </span>
            </label>
          </div>
          {errors?.hasSanitaryCertificate && (
            <p className="text-red-600 text-[10px] font-bold md:col-span-3">
              {errors.hasSanitaryCertificate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Store, MapPin, Clock, HelpCircle, Phone } from "lucide-react";

/**
 * 🧑‍🌾 COMPOSANT : HarvestLogisticsForm.jsx
 * Emplacement : src/pages/MonProfil/Producteur/components/HarvestLogisticsForm.jsx
 * Responsabilité unique : Gérer les données légales fiscales et l'organisation logistique de ramassage du maraîcher.
 */
export default function HarvestLogisticsForm({
  profileData,
  onChange,
  errors,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-xs">
      {/* 1. DONNÉES LÉGALES ET FISCALES */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <Store size={16} className="text-amber-700" /> Identification Fiscale
          de l'Exploitation Agricole
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          {/* Nom de l'exploitation */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Nom de l'Exploitation (Raison Sociale) *
            </label>
            <input
              type="text"
              value={profileData?.companyName || ""}
              onChange={(e) => onChange("companyName", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : La Ferme Maraîchère de la Rosée"
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
              Numéro de SIRET Exploitant *
            </label>
            <input
              type="text"
              maxLength="14"
              value={profileData?.siret || ""}
              onChange={(e) => onChange("siret", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : 98765432100045"
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
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : FR12987654321"
            />
            {errors?.vatNumber && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.vatNumber}
              </p>
            )}
          </div>

          {/* IDU ADEME */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1">
              Identifiant Unique ADEME (REP Emballages) *
              <HelpCircle
                size={11}
                className="text-gray-300 cursor-help"
                title="Obligation environnementale d'enregistrement pour la traçabilité des emballages de vos légumes."
              />
            </label>
            <input
              type="text"
              value={profileData?.iduAdeme || ""}
              onChange={(e) => onChange("iduAdeme", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-mono focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : FR456789_01ECOR"
            />
            {errors?.iduAdeme && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.iduAdeme}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. LOGISTIQUE DE PASSAGE ET RAMASSAGE (BONS DE CHARGEMENT) */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
          <MapPin size={16} className="text-amber-700" /> Logistique de Récolte,
          Préparation & Ramassage (Matin)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          {/* Téléphone point ramassage */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Téléphone Direct d'Urgence Hangar (Maraîcher) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={profileData?.harvestPhone || ""}
                onChange={(e) => onChange("harvestPhone", e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
                placeholder="Ex : 06 12 34 56 78"
              />
              <Phone
                size={14}
                className="absolute left-3.5 top-3.5 text-gray-400"
              />
            </div>
            {errors?.harvestPhone && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.harvestPhone}
              </p>
            )}
          </div>

          {/* Adresse point ramassage */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Adresse Physique du Point de Chargement (Hangar / Cour de ferme) *
            </label>
            <textarea
              rows="2"
              value={profileData?.producerAddress || ""}
              onChange={(e) => onChange("producerAddress", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : 42 Chemin de la Rosée, Hangar Agricole Nord (portail vert), 38120 Saint-Egrève"
            />
            {errors?.producerAddress && (
              <p className="text-red-600 text-[10px] font-bold">
                {errors.producerAddress}
              </p>
            )}
          </div>

          {/* Délai de préparation requis */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Délai Minimum de Coupe exigé *
            </label>
            <select
              value={profileData?.prepTimeLimit || "24h"}
              onChange={(e) => onChange("prepTimeLimit", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none bg-white cursor-pointer focus:border-amber-600"
            >
              <option value="12h">
                12 heures avant ramassage (Coupe ultra-fraîche)
              </option>
              <option value="24h">
                24 heures avant ramassage (Standard maraîchage)
              </option>
              <option value="48h">
                48 heures avant ramassage (Maraîchage lourd / Racine)
              </option>
            </select>
          </div>

          {/* Heure idéale de passage */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Heure Souhaitée de passage du Chauffeur *
            </label>
            <div className="relative">
              <input
                type="time"
                value={profileData?.preferredPickupTime || "08:00"}
                onChange={(e) =>
                  onChange("preferredPickupTime", e.target.value)
                }
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              />
              <Clock
                size={14}
                className="absolute left-3.5 top-3.5 text-gray-400"
              />
            </div>
          </div>

          {/* Zone de stockage / Température */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Type de stockage des caisses récoltées (HACCP)
            </label>
            <select
              value={profileData?.storageType || "ambiante"}
              onChange={(e) => onChange("storageType", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none bg-white cursor-pointer focus:border-amber-600"
            >
              <option value="ambiante">
                Température Ambiante (Hangar aéré)
              </option>
              <option value="frigo_positif">
                Chambre Froide Positive (+2°C à +6°C) (HACCP)
              </option>
              <option value="cave_isotherme">Isotherme / Cave humide</option>
            </select>
          </div>

          {/* Instructions d'accès et tonnage */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Instructions de manœuvre pour le camion de ramassage (ex : Poids
              Lourd 19t)
            </label>
            <textarea
              rows="2"
              value={profileData?.pickupInstructions || ""}
              onChange={(e) => onChange("pickupInstructions", e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600"
              placeholder="Ex : Demi-tour facile dans la cour. Aire de retournement goudronnée en face du hangar bio."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

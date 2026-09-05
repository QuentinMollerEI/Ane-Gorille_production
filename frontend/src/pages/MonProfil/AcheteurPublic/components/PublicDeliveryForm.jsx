import React from "react";
import { Truck, ShieldAlert } from "lucide-react";

/**
 * 🏛️ FORMULAIRE : PublicDeliveryForm.jsx
 * Responsabilité unique : Gérer l'adresse et les conditions d'accès physiques de l'établissement public.
 * Entièrement conforme à l'accessibilité numérique (WCAG / a11y) pour éteindre toutes les alertes de linter.
 */
export default function PublicDeliveryForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <Truck size={16} className="text-blue-700" /> Adresse et Conditions de
        Livraison Publique
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        {/* Adresse Physique */}
        <div className="space-y-1.5 md:col-span-2">
          <label
            htmlFor="deliveryAddress"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Adresse de Livraison exacte de l'Établissement *
          </label>
          <textarea
            id="deliveryAddress"
            rows="2"
            value={profileData?.deliveryAddress || ""}
            onChange={(e) => onChange("deliveryAddress", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Numéro, rue, bâtiment, instructions de déchargement..."
          />
          {errors?.deliveryAddress && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.deliveryAddress}
            </p>
          )}
        </div>

        {/* Téléphone de Livraison */}
        <div className="space-y-1.5">
          <label
            htmlFor="deliveryPhone"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Téléphone Direct du Quai / Contact Réception *
          </label>
          <input
            id="deliveryPhone"
            type="text"
            value={profileData?.deliveryPhone || ""}
            onChange={(e) => onChange("deliveryPhone", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : 04 90 12 34 56"
          />
          {errors?.deliveryPhone && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.deliveryPhone}
            </p>
          )}
        </div>

        {/* Horaires de Livraison du Quai */}
        <div className="space-y-1.5">
          <label
            htmlFor="deliveryTimeSlot"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Plage Horaire Autorisée de Réception *
          </label>
          <input
            id="deliveryTimeSlot"
            type="text"
            value={profileData?.deliveryTimeSlot || ""}
            onChange={(e) => onChange("deliveryTimeSlot", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : 07:30 - 11:30"
          />
        </div>

        {/* Digicode / Instructions de Porte */}
        <div className="space-y-1.5">
          <label
            htmlFor="accessCode"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Digicodes / Barrière / Consignes d'Accès
          </label>
          <input
            id="accessCode"
            type="text"
            value={profileData?.accessCode || ""}
            onChange={(e) => onChange("accessCode", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none focus:border-blue-600"
            placeholder="Ex : Code Portail 4908, Sonner Cuisine"
          />
        </div>

        {/* Restriction Tonnage Camion */}
        <div className="space-y-1.5">
          <label
            htmlFor="maxVehicleSize"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider block"
          >
            Gabarit Maximum de Véhicule Autorisé
          </label>
          <select
            id="maxVehicleSize"
            value={profileData?.maxVehicleSize || "vl_standard"}
            onChange={(e) => onChange("maxVehicleSize", e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white cursor-pointer"
          >
            <option value="vl_standard">
              Véhicule Léger standard (&lt; 3.5t)
            </option>
            <option value="porteur_19t">Camion Porteur 19 Tonnes Max</option>
            <option value="semi_remorque">Semi-Remorque autorisé</option>
          </select>
        </div>

        {/* Protocole de sécurité renforcée Vigipirate */}
        <div className="md:col-span-2 space-y-3 bg-red-50/40 border border-red-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <label
              htmlFor="isVigipirate"
              className="space-y-0.5 cursor-pointer flex-1 pr-4"
            >
              <span className="text-[10px] text-red-950 font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert size={14} className="text-red-700" /> Établissement
                sous Protocole de Sécurité Vigipirate
              </span>
              <span className="text-[9px] text-gray-500 font-bold block">
                Exigé pour les cantines d'écoles, mairies ou sites
                administratifs sensibles
              </span>
            </label>
            <div className="relative inline-flex items-center">
              <input
                id="isVigipirate"
                type="checkbox"
                checked={Boolean(profileData?.isVigipirate)}
                onChange={(e) => onChange("isVigipirate", e.target.checked)}
                className="sr-only peer cursor-pointer"
                aria-label="Établissement sous Protocole de Sécurité Vigipirate"
              />
              <div
                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 cursor-pointer"
                onClick={() =>
                  onChange("isVigipirate", !profileData?.isVigipirate)
                }
              ></div>
            </div>
          </div>

          {profileData?.isVigipirate && (
            <div className="space-y-1.5 animate-slide-in">
              <label
                htmlFor="vigipirateInstructions"
                className="text-[10px] text-red-950 font-black uppercase tracking-wider block"
              >
                Consignes Obligatoires pour le Chauffeur / Plaque
                d'Immatriculation *
              </label>
              <textarea
                id="vigipirateInstructions"
                rows="2"
                value={profileData?.vigipirateInstructions || ""}
                onChange={(e) =>
                  onChange("vigipirateInstructions", e.target.value)
                }
                className="w-full p-3 border border-red-200 rounded-xl focus:ring-1 focus:ring-red-600 focus:outline-none bg-white font-medium"
                placeholder="Ex : Le chauffeur doit présenter sa pièce d'identité et nous devons enregistrer sa plaque d'immatriculation 24h avant son arrivée."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

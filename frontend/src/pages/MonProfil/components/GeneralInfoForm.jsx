import React from "react";
import { User, Phone, Mail, Lock } from "lucide-react";

export default function GeneralInfoForm({ profileData, onChange, errors }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <User size={16} className="text-green-700" /> Identité du Référent de
        Compte
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Nom et Prénom du Responsable *
          </label>
          <div className="relative">
            <input
              id="displayName"
              type="text"
              value={profileData?.displayName || ""}
              onChange={(e) => onChange("displayName", e.target.value)}
              className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
              placeholder="Ex : Martin Dupont"
            />
            <User
              size={14}
              className="absolute left-3.5 top-3.5 text-gray-400"
            />
          </div>
          {errors?.displayName && (
            <p className="text-red-600 text-[10px] font-bold">
              {errors.displayName}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1"
          >
            E-mail de Connexion <Lock size={10} className="text-gray-400" />
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={profileData?.email || ""}
              disabled
              className="w-full p-3 pl-10 border border-gray-100 bg-gray-50 text-gray-400 rounded-xl cursor-not-allowed font-medium"
              placeholder="email@domaine.fr"
            />
            <Mail
              size={14}
              className="absolute left-3.5 top-3.5 text-gray-300"
            />
          </div>
          <p className="text-[9px] text-gray-400 font-bold leading-none mt-1">
            Identifiant de compte non modifiable
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="text-[10px] text-gray-400 font-black uppercase tracking-wider"
          >
            Téléphone Direct de Liaison *
          </label>
          <div className="relative">
            <input
              id="phone"
              type="text"
              value={profileData?.phone || ""}
              onChange={(e) => onChange("phone", e.target.value)}
              className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-600 focus:outline-none focus:border-green-600"
              placeholder="Ex : 06 12 34 56 78"
            />
            <Phone
              size={14}
              className="absolute left-3.5 top-3.5 text-gray-400"
            />
          </div>
          {errors?.phone && (
            <p className="text-red-600 text-[10px] font-bold">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}

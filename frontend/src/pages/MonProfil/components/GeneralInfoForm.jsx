import React from "react";
import { UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useProfileForm } from "../hooks/useProfileForm.js";
import BankDetailsSection from "./BankDetailsSection.jsx";

export default function GeneralInfoForm() {
  const { profileData, loading, saving, message, handleChange, handleSave } = useProfileForm();

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-500 animate-pulse">
        Chargement de vos informations...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <UserCheck size={22} className="text-emerald-700" />
          Informations Générales du Compte
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Gérez la raison sociale, le numéro SIRET et vos coordonnées de facturation.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Raison Sociale / Nom</label>
          <input
            type="text"
            name="companyName"
            value={profileData.companyName || ""}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Numéro SIRET</label>
          <input
            type="text"
            name="siret"
            value={profileData.siret || ""}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Téléphone Direct</label>
          <input
            type="text"
            name="phone"
            value={profileData.phone || ""}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Adresse Siège / Quai</label>
          <input
            type="text"
            name="address"
            value={profileData.address || ""}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {(profileData.role === "producteur" || profileData.role === "artisan") && (
        <BankDetailsSection profileData={profileData} handleChange={handleChange} />
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
      >
        {saving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
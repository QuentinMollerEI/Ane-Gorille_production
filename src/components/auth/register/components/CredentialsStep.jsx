import React from "react";

export function CredentialsStep({
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  password,
  onPasswordChange
}) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
            Adresse E-mail *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={onEmailChange}
            placeholder="contact@entreprise.fr"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
            Téléphone
          </label>
          <input
            type="text"
            value={phone}
            onChange={onPhoneChange}
            placeholder="06 00 00 00 00"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
          Mot de Passe *
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={onPasswordChange}
          placeholder="••••••••"
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
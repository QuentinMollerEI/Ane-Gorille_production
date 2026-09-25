import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

export default function BankDetailsSection({ profileData, handleChange }) {
  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <CreditCard size={16} className="text-emerald-600" />
        Coordonnées Bancaires (Reversement Stripe Connect)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">IBAN de Reversement *</label>
          <input
            type="text"
            name="iban"
            value={profileData.iban || ""}
            onChange={handleChange}
            placeholder="FR76 3000 2005 0000 0000 0000 000"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Code BIC / SWIFT *</label>
          <input
            type="text"
            name="bic"
            value={profileData.bic || ""}
            onChange={handleChange}
            placeholder="BNPAFRPPXXX"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
        <ShieldCheck size={14} className="text-emerald-600" />
        Vos données bancaires sont chiffrées et sécurisées conformément aux normes PCI-DSS.
      </p>
    </div>
  );
}
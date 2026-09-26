import React, { useState } from "react";
import { CreditCard, ShieldCheck, Lock, Loader2 } from "lucide-react";

export function StripePaymentForm({ totalTTC, onSubmitPayment, isProcessing, disabled }) {
  const [cardHolder, setCardHolder] = useState("");

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmitPayment({ cardHolder });
  };

  return (
    <form onSubmit={handleFormSubmit} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-700" />
          Paiement Sécurisé par Carte (Stripe Connect DSP2)
        </h4>
        <span className="text-[10px] bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
          <Lock size={10} /> Cryptage SSL 256-bit
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
            Nom figurant sur la carte *
          </label>
          <input
            type="text"
            required
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="M. Quentin Moller"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="p-4 bg-white border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-500 text-center tracking-widest">
          •••• •••• •••• Stripe Elements Direct
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || isProcessing || !cardHolder.trim()}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span>Autorisation bancaire en cours...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Payer et Valider la Commande ({totalTTC.toFixed(2)} € TTC)</span>
          </>
        )}
      </button>

      <p className="text-[10px] text-center text-slate-500 font-medium">
        Les fonds sont cantonnés sous séquestre Stripe et reversés aux vendeurs après livraison validée.
      </p>
    </form>
  );
}
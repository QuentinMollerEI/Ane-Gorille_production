import React from "react";
import { Coins, Percent } from "lucide-react";

export default function PricingSection({ formData, handleChange, calculatedPrices }) {
  const { priceHTNum, commissionHT, netProducerHT, vatAmount, priceTTC } = calculatedPrices;

  return (
    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Coins size={16} className="text-emerald-600" />
        Tarification & Transparence Commission
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Prix Vente HT (€) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="priceHT"
            value={formData.priceHT}
            onChange={handleChange}
            placeholder="0.00"
            required
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
            <Percent size={12} /> Taux TVA
          </label>
          <select
            name="vatRate"
            value={formData.vatRate}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value={5.5}>5,5 % (Alimentaire / Taux Réduit Âne)</option>
            <option value={20.0}>20,0 % (Artisanat / Taux Normal Gorille)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase">Stock Initial *</label>
          <input
            type="number"
            min="0"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            placeholder="100"
            required
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {priceHTNum > 0 && (
        <div className="bg-emerald-900 text-white p-4 rounded-xl text-xs space-y-2 shadow-inner">
          <div className="flex justify-between items-center text-emerald-200 font-medium">
            <span>Prix Vente Public HT :</span>
            <span className="font-bold text-white">{priceHTNum.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-emerald-300">
            <span>Commission Marketplace (12 % HT) :</span>
            <span>- {commissionHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-emerald-100 font-bold border-t border-emerald-800 pt-1">
            <span>Net Reversé au Producteur HT :</span>
            <span className="text-emerald-300">{netProducerHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 text-[11px] pt-1">
            <span>Prix Final Client TTC (avec TVA {formData.vatRate}%) :</span>
            <span className="font-black text-white">{priceTTC.toFixed(2)} € TTC</span>
          </div>
        </div>
      )}
    </div>
  );
}
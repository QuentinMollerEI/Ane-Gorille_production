import React from "react";
import { Receipt, CreditCard, ShieldCheck, Truck, Percent, FileText } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingFinancialSummary.jsx
 * Récapitulatif financier, TVA ventilée (5.5% denrées + 20% transport) et statut Chorus Pro / Factur-X en Régime Réel de TVA.
 */
export default function TrackingFinancialSummary({ order }) {
  if (!order) return null;

  const totalHT = Number(order.totalHT ?? order.amountHT ?? order.priceHT ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? order.shippingFee ?? 0);
  const deliveryFeeVAT = Number(order.deliveryFeeVAT ?? (deliveryFee * 0.20));
  const foodVAT = Number(order.foodVAT ?? (totalHT * 0.055));
  const vatAmount = Number(order.totalVAT ?? (foodVAT + deliveryFeeVAT));
  const totalTTC = Number(order.totalTTC ?? order.amountTTC ?? (totalHT + deliveryFee + vatAmount));

  const isPublicBuyer = order.buyerRole === "buyer_public" || order.isChorusPro;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
          <Receipt size={15} className="text-emerald-700" />
          <span>Détail Financier & Facturation (Régime Réel de TVA)</span>
        </h4>
        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <CreditCard size={12} />
          <span>Payé via Stripe Connect</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Produits HT</span>
          <span className="text-sm font-black text-gray-900 font-mono">{totalHT.toFixed(2)} € HT</span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Truck size={10} />
            <span>Frais de Port B2B</span>
          </span>
          <span className="text-sm font-black text-gray-900 font-mono">
            {deliveryFee === 0 ? "Offerts (Franco)" : `${deliveryFee.toFixed(2)} € HT`}
          </span>
          {deliveryFee > 0 && (
            <span className="text-[9px] text-gray-400 font-medium block mt-0.5 font-mono">
              + TVA 20% ({deliveryFeeVAT.toFixed(2)} €)
            </span>
          )}
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Percent size={10} />
            <span>TVA Totale Récupérable</span>
          </span>
          <span className="text-sm font-black text-gray-900 font-mono">{vatAmount.toFixed(2)} €</span>
          <span className="text-[9px] text-gray-400 font-medium block mt-0.5 font-mono">
            (5.5% : {foodVAT.toFixed(2)}€ | 20% : {deliveryFeeVAT.toFixed(2)}€)
          </span>
        </div>

        <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
          <span className="text-[9px] font-bold text-emerald-800 uppercase block">Total Général TTC</span>
          <span className="text-sm font-black text-emerald-900 font-mono">{totalTTC.toFixed(2)} € TTC</span>
        </div>
      </div>

      {/* Conformité Factur-X & Chorus Pro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-200/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
          <span>Factur-X certifié — Conformité Chorus Pro & DGFIP (TVA 20% sur Services & Commissions)</span>
        </div>

        {isPublicBuyer && (
          <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
            <FileText size={11} />
            <span>Transmis à Chorus Pro (Secteur Public)</span>
          </span>
        )}
      </div>
    </div>
  );
}
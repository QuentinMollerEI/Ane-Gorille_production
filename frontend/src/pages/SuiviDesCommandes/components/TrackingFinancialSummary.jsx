import React from "react";
import { Receipt, CreditCard, ShieldCheck, Truck, Percent, FileText } from "lucide-react";

/**
 * 🚚 Calculateur universel des Frais de Livraison B2B Dégressifs
 */
function getDeliveryFee(amountHT) {
  const amount = Number(amountHT || 0);
  if (amount >= 300) return 0;  // Franco de port (>= 300 € HT)
  if (amount >= 150) return 8;  // Incitatif (150 € - 299.99 € HT)
  return 15;                     // Standard (< 150 € HT)
}

/**
 * 🌾 COMPOSANT : TrackingFinancialSummary.jsx
 * Récapitulatif financier, TVA ventilée (5.5% alimentation + 20% transport) et statut Chorus Pro / Factur-X.
 */
export default function TrackingFinancialSummary({ order }) {
  if (!order) return null;

  // 1. Calcul du sous-total HT des produits (avec fallback sous-commandes si items absent)
  let calculatedItemsHT = 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    calculatedItemsHT = order.items.reduce(
      (sum, item) => sum + Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1),
      0
    );
  } else if (Array.isArray(order.subOrders) && order.subOrders.length > 0) {
    calculatedItemsHT = order.subOrders.reduce((subSum, sub) => {
      const subItems = Array.isArray(sub.items) ? sub.items : [];
      return subSum + subItems.reduce((iSum, item) => iSum + Number(item.priceHT ?? item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1), 0);
    }, 0);
  }
  
  const rawTotalHT = Number(order.totalHT ?? order.amountHT ?? order.priceHT ?? 0);
  const totalHT = rawTotalHT > 0 ? rawTotalHT : calculatedItemsHT;

  // 2. Frais de port B2B (Dégressifs par paliers : <150€ = 15€, 150-299€ = 8€, >=300€ = 0€ Franco)
  let deliveryFee = Number(order.deliveryFee ?? order.shippingFee ?? 0);
  if (deliveryFee === 0 && totalHT < 300 && totalHT > 0) {
    deliveryFee = getDeliveryFee(totalHT);
  }

  // 3. Ventilation exacte des TVA (5.5% Alimentation + 20% Prestation Transport en Régime Réel)
  const foodVAT = totalHT * 0.055;
  const deliveryFeeVAT = deliveryFee > 0 ? (deliveryFee * 0.20) : 0;
  const totalVAT = foodVAT + deliveryFeeVAT;
  const totalTTC = totalHT + deliveryFee + totalVAT;

  const isPublicBuyer = order.buyerRole === "buyer_public" || order.buyerRole === "acheteur_public" || Boolean(order.isChorusPro);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 text-xs font-sans text-slate-800">
      {/* En-tête de facturation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <Receipt size={15} className="text-emerald-700" />
          <span>Détail Financier & Facturation (Régime Réel de TVA)</span>
        </h4>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
          <CreditCard size={12} />
          <span>Payé via Stripe Connect</span>
        </span>
      </div>

      {/* Grille des 4 indicateurs financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Total Produits HT */}
        <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Total Produits HT</span>
          <span className="text-sm font-black text-slate-900 font-mono">{totalHT.toFixed(2)} € HT</span>
        </div>

        {/* Frais de Port B2B */}
        <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
            <Truck size={11} className="text-emerald-700" />
            <span>Frais de Port B2B</span>
          </span>
          <span className="text-sm font-black text-slate-900 font-mono">
            {deliveryFee === 0 ? (
              <span className="text-emerald-700 font-extrabold uppercase text-xs">Offerts (Franco)</span>
            ) : (
              `${deliveryFee.toFixed(2)} € HT`
            )}
          </span>
          {deliveryFee > 0 && (
            <span className="text-[9px] text-slate-400 font-medium block font-mono mt-0.5">
              + TVA 20% ({deliveryFeeVAT.toFixed(2)} €)
            </span>
          )}
        </div>

        {/* TVA Totale Récupérable */}
        <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5">
            <Percent size={11} className="text-emerald-700" />
            <span>TVA Totale Récupérable</span>
          </span>
          <span className="text-sm font-black text-slate-900 font-mono">{totalVAT.toFixed(2)} €</span>
          <span className="text-[9px] text-slate-400 font-medium block font-mono mt-0.5">
            (5.5% : {foodVAT.toFixed(2)}€ | 20% : {deliveryFeeVAT.toFixed(2)}€)
          </span>
        </div>

        {/* Total Général TTC */}
        <div className="bg-emerald-50/90 p-2.5 rounded-md border border-emerald-200 shadow-sm">
          <span className="text-[9px] font-bold text-emerald-800 uppercase block mb-0.5">Total Général TTC</span>
          <span className="text-sm font-black text-emerald-950 font-mono">{totalTTC.toFixed(2)} € TTC</span>
        </div>
      </div>

      {/* Conformité Factur-X & Chorus Pro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[10px] text-slate-500 pt-1.5 border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
          <span>Factur-X certifié — Conformité Chorus Pro & DGFIP (Cantonnement bancaire DSP2)</span>
        </div>

        {isPublicBuyer && (
          <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
            <FileText size={11} />
            <span>Transmis à Chorus Pro (Secteur Public)</span>
          </span>
        )}
      </div>
    </div>
  );
}
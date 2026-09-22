import React from "react";
import { Calculator, Truck, ShieldCheck, Tag } from "lucide-react";

/**
 * 🚚 Calculateur universel des Frais de Livraison B2B Dégressifs
 * @param {number} subtotalHT - Montant total HT des produits du panier
 * @returns {number} Montant des frais de port en € HT
 */
export function calculateDeliveryFee(subtotalHT) {
  const amount = Number(subtotalHT || 0);
  if (amount >= 300) return 0;  // Level 3: Franco de port (>= 300 €)
  if (amount >= 150) return 8;  // Level 2: Incitatif (150 € - 299,99 €)
  return 15;                   // Level 1: Standard (< 150 €)
}

/**
 * 🧮 Calculateur universel des totaux financiers consolidés d'une commande
 */
export function computeConsolidatedOrderTotals(order) {
  if (!order) {
    return {
      productsHT: 0,
      deliveryFeeHT: 0,
      vatProducts: 0,
      vatDelivery: 0,
      totalVAT: 0,
      totalTTC: 0
    };
  }

  // 1. Montant total produits HT
  const items = order.items || [];
  const productsHT = items.length > 0
    ? items.reduce((sum, item) => {
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.priceHT ?? item.price ?? 0);
        return sum + (price * qty);
      }, 0)
    : Number(order.totalHT ?? order.amountHT ?? 0);

  // 2. Frais de livraison B2B
  const rawFee = order.deliveryFee ?? order.deliveryFeeHT ?? order.shippingFee ?? order.deliveryDetails?.deliveryFee;
  let deliveryFeeHT = 0;
  if (rawFee !== undefined && rawFee !== null && Number(rawFee) > 0) {
    deliveryFeeHT = Number(rawFee);
  } else {
    deliveryFeeHT = calculateDeliveryFee(productsHT);
  }

  // 3. Ventilation des taxes
  const vatProducts = productsHT * 0.055;   // TVA 5,5 % sur les denrées alimentaires
  const vatDelivery = deliveryFeeHT * 0.20;  // TVA 20,0 % sur la prestation de transport
  const totalVAT = vatProducts + vatDelivery;
  
  // Total Général TTC calculé
  const computedTotalTTC = productsHT + deliveryFeeHT + totalVAT;

  // Si order.totalTTC stocké en base est déjà supérieur ou égal à la valeur calculée (avec livraison + TVA), on l'utilise,
  // sinon on prend la valeur consolidée exacte !
  const rawTotalTTC = Number(order.totalTTC ?? order.totalAmount ?? order.amountTTC ?? order.amount ?? 0);
  const totalTTC = (rawTotalTTC >= computedTotalTTC && rawTotalTTC > productsHT + 5) ? rawTotalTTC : computedTotalTTC;

  return {
    productsHT,
    deliveryFeeHT,
    vatProducts,
    vatDelivery,
    totalVAT,
    totalTTC
  };
}

/**
 * 🧮 COMPOSANT : TrackingFinancialSummary.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/TrackingFinancialSummary.jsx
 */
export default function TrackingFinancialSummary({ order, subOrders = [] }) {
  if (!order) return null;

  const totals = computeConsolidatedOrderTotals(order);
  const subOrdersCount = subOrders.length || (order.producerIds?.length || 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs font-sans text-slate-800">
      {/* En-tête de la synthèse */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
        <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
          <Calculator size={15} className="text-emerald-700" /> Synthèse Financière Consolidée
        </span>
        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
          {subOrdersCount} sous-commande{subOrdersCount > 1 ? "s" : ""} maraîchère{subOrdersCount > 1 ? "s" : ""}
        </span>
      </div>

      {/* Corps des montants détaillés */}
      <div className="p-3.5 space-y-2 bg-slate-50/40">
        {/* Ligne 1 : Total Produits HT */}
        <div className="flex justify-between items-center text-slate-700">
          <span className="flex items-center gap-1.5">
            <Tag size={13} className="text-slate-400 shrink-0" />
            <span>Total Produits HT ({subOrdersCount} sous-commande{subOrdersCount > 1 ? "s" : ""}) :</span>
          </span>
          <span className="font-mono font-bold text-slate-900">{totals.productsHT.toFixed(2)} € HT</span>
        </div>

        {/* Ligne 2 : Frais de livraison B2B */}
        <div className="flex justify-between items-center text-slate-700">
          <span className="flex items-center gap-1.5">
            <Truck size={13} className="text-emerald-700 shrink-0" />
            <span>Frais de Livraison B2B ({totals.productsHT >= 300 ? "Franco de port" : "Barème dégressif"}) :</span>
          </span>
          <span className={`font-mono font-extrabold ${totals.deliveryFeeHT === 0 ? "text-emerald-700" : "text-slate-900"}`}>
            {totals.deliveryFeeHT > 0 ? `${totals.deliveryFeeHT.toFixed(2)} € HT` : "0.00 € (Offert)"}
          </span>
        </div>

        {/* Ligne 3 : TVA Alimentation 5,5% */}
        <div className="flex justify-between items-center text-slate-600 text-[11px]">
          <span className="pl-5">TVA Alimentation (5,5 % sur produits) :</span>
          <span className="font-mono">{totals.vatProducts.toFixed(2)} €</span>
        </div>

        {/* Ligne 4 : TVA Transport 20,0% */}
        {totals.deliveryFeeHT > 0 && (
          <div className="flex justify-between items-center text-slate-600 text-[11px]">
            <span className="pl-5">TVA Prestation Transport (20,0 % sur livraison) :</span>
            <span className="font-mono">{totals.vatDelivery.toFixed(2)} €</span>
          </div>
        )}

        {/* Total TVA Cumulée */}
        <div className="flex justify-between items-center text-slate-500 text-[10px] pt-1 border-t border-slate-100">
          <span className="pl-5 font-semibold">Sous-total TVA globale :</span>
          <span className="font-mono font-bold">{totals.totalVAT.toFixed(2)} €</span>
        </div>
      </div>

      {/* Bandeau Final Total TTC */}
      <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center border-t-2 border-emerald-600">
        <span className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-emerald-400" /> Total Général TTC :
        </span>
        <span className="font-mono font-black text-base text-emerald-400">
          {totals.totalTTC.toFixed(2)} € TTC
        </span>
      </div>
    </div>
  );
}

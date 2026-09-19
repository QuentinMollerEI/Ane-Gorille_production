import React from "react";
import { Receipt, CreditCard, ShieldCheck, Truck, Percent, FileText, Building } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingFinancialSummary.jsx
 * Récapitulatif financier et règles de paiement adaptées :
 * - Stripe Connect B2B : Cantonnement DSP2
 * - Virement B2B : Facturation différée LME (30 jours)
 * - Chorus Pro B2G : Engagement budgétaire et dépôt Factur-X
 */
export default function TrackingFinancialSummary({ order }) {
  if (!order) return null;

  const totalHT = Number(order.totalHT ?? order.amountHT ?? order.priceHT ?? 0);
  const vatAmount = Number(order.totalVAT ?? order.vatAmount ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? order.shippingFee ?? 0);
  const totalTTC = Number(order.totalTTC ?? order.amountTTC ?? order.totalAmount ?? (totalHT + vatAmount + deliveryFee));

  const paymentMethod = order.paymentMethod || "stripe_b2b";
  const refEngagement = order.refEngagement || "-";

  const isMandat = paymentMethod === "mandat_public" || paymentMethod === "mandat" || order.buyerRole === "acheteur_public";
  const isVirement = paymentMethod === "virement_b2b" || paymentMethod === "virement" || order.status === "EN_ATTENTE_VIREMENT";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-2 gap-2">
        <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
          <Receipt size={15} className="text-emerald-700" />
          <span>Détail Financier & Modalité de Règlement</span>
        </h4>

        {isMandat ? (
          <span className="text-[10px] font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
            <FileText size={12} />
            <span>Chorus Pro — Mandat Public 30j</span>
          </span>
        ) : isVirement ? (
          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
            <Building size={12} />
            <span>Virement B2B — Différé LME 30j</span>
          </span>
        ) : (
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CreditCard size={12} />
            <span>Payé via Stripe Connect</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Produits HT</span>
          <span className="text-sm font-black text-gray-900">{totalHT.toFixed(2)} € HT</span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Percent size={10} />
            <span>TVA Alimentation (5.5%)</span>
          </span>
          <span className="text-sm font-black text-gray-900">{vatAmount.toFixed(2)} €</span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Truck size={10} />
            <span>Frais de Port B2B</span>
          </span>
          <span className="text-sm font-black text-gray-900">
            {deliveryFee === 0 ? "Offerts (Franchise)" : `${deliveryFee.toFixed(2)} € HT`}
          </span>
        </div>

        <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
          <span className="text-[9px] font-bold text-emerald-800 uppercase block">Total Général TTC</span>
          <span className="text-sm font-black text-emerald-900">{totalTTC.toFixed(2)} € TTC</span>
        </div>
      </div>

      {/* Description du flux financier selon le mode de paiement */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-200/80">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
          {isMandat ? (
            <span>Conformité Factur-X B2G — N° Engagement Budgétaire : <strong>{refEngagement}</strong></span>
          ) : isVirement ? (
            <span>Facture B2B payable sous 30 jours — Rapprochement bancaire interentreprises</span>
          ) : (
            <span>Cantonnement bancaire DSP2 & Ventilation automatique Stripe (82% Vendeur / 18% Commission)</span>
          )}
        </div>

        {isMandat && (
          <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
            <FileText size={11} />
            <span>Télétransmis à Chorus Pro</span>
          </span>
        )}
      </div>
    </div>
  );
}
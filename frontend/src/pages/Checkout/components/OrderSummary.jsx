import React from "react";
import { ShoppingBag, Truck, Receipt, CheckCircle2 } from "lucide-react";

export function OrderSummary({ cart, totals, isB2G }) {
  const { subtotalHT, shippingCostHT, tvaProducts, tvaShipping, totalTTC, meetsMinimumOrder } = totals;

  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
          <ShoppingBag className="text-emerald-700" size={18} />
          Récapitulatif de Commande ({cart.length} article{cart.length > 1 ? "s" : ""})
        </h3>
        {isB2G && (
          <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-black">
            Secteur Public (B2G)
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
            <div>
              <p className="font-bold text-slate-800">{item.name || item.title}</p>
              <p className="text-[10px] text-slate-500">Qté : {item.quantity} x {item.price} € HT</p>
            </div>
            <p className="font-mono font-bold text-slate-900">
              {(item.price * item.quantity).toFixed(2)} € HT
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
        <div className="flex justify-between text-slate-600 font-semibold">
          <span>Sous-total produits HT :</span>
          <span className="font-mono font-bold">{subtotalHT.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between text-slate-600 font-semibold items-center">
          <span className="flex items-center gap-1">
            <Truck size={14} className="text-slate-400" />
            Frais de livraison HT (Périmètre 50 km) :
          </span>
          <span className="font-mono font-bold">
            {shippingCostHT === 0 ? (
              <span className="text-emerald-700 font-black">GRATUIT (Franco)</span>
            ) : (
              `${shippingCostHT.toFixed(2)} €`
            )}
          </span>
        </div>

        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>TVA Alimentaire (5,5 %) :</span>
          <span className="font-mono">{tvaProducts.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>TVA Transport (20 %) :</span>
          <span className="font-mono">{tvaShipping.toFixed(2)} €</span>
        </div>

        <div className="flex justify-between text-slate-900 text-sm font-black pt-2 border-t border-slate-300">
          <span>TOTAL TTC À PAYER :</span>
          <span className="font-mono text-emerald-800 text-base">{totalTTC.toFixed(2)} €</span>
        </div>
      </div>

      {!meetsMinimumOrder && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-bold">
          ⚠️ Le minimum de commande est de 50,00 € HT.
        </div>
      )}
    </div>
  );
}
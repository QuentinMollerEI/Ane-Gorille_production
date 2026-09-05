import React from "react";
import { DollarSign, Percent, Landmark, Award } from "lucide-react";

export default function AccountingTotals({ invoices }) {
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    let b2gCount = 0;
    let b2bCount = 0;

    invoices.forEach((inv) => {
      totalHT += parseFloat(inv.totalHT || 0);
      totalTVA += parseFloat(inv.totalTVA || 0);
      totalTTC += parseFloat(inv.totalTTC || 0);
      if (inv.buyerProfile === "B2G") {
        b2gCount++;
      } else {
        b2bCount++;
      }
    });

    return {
      totalHT,
      totalTVA,
      totalTTC,
      b2gCount,
      b2bCount,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Total Achats HT
          </span>
          <p className="text-xl font-black text-gray-900">
            {totals.totalHT.toFixed(2)} €
          </p>
        </div>
        <div className="w-10 h-10 bg-gray-50 border rounded-xl flex items-center justify-center text-gray-500">
          <DollarSign size={20} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            TVA Déductible
          </span>
          <p className="text-xl font-black text-green-700">
            {totals.totalTVA.toFixed(2)} €
          </p>
        </div>
        <div className="w-10 h-10 bg-green-50 border border-green-150 rounded-xl flex items-center justify-center text-green-600">
          <Percent size={18} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Montant Total TTC
          </span>
          <p className="text-xl font-black text-green-800">
            {totals.totalTTC.toFixed(2)} €
          </p>
        </div>
        <div className="w-10 h-10 bg-green-700 text-white rounded-xl flex items-center justify-center shadow-xs">
          <Award size={20} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Répartition des Flux
          </span>
          <p className="text-xs font-bold text-gray-600 leading-snug">
            <span className="text-blue-700 font-black">
              {totals.b2gCount} B2G
            </span>{" "}
            (Chorus Pro)
            <br />
            <span className="text-green-700 font-black">
              {totals.b2bCount} B2B
            </span>{" "}
            (Billie Pay)
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 border border-blue-150 rounded-xl flex items-center justify-center text-blue-600">
          <Landmark size={18} />
        </div>
      </div>
    </div>
  );
}

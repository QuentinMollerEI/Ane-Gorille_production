import React, { useState } from "react";
import { TrendingUp, Clock, ChevronUp, ChevronDown, Award } from "lucide-react";

export default function ProducerIndicators({ documents = [] }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Filtrage et calculs 100% dynamiques basés sur les données réelles
  const saleDocs = documents.filter((doc) => doc.type === "Facture de Vente");
  const commissionDocs = documents.filter(
    (doc) => doc.type === "Facture de Commission" && doc.status === "paid",
  );

  const grossSales = saleDocs.reduce(
    (sum, doc) => sum + (Number(doc.amountTTC) || 0),
    0,
  );
  const totalCommissions = commissionDocs.reduce(
    (sum, doc) => sum + (Number(doc.amountTTC) || 0),
    0,
  );

  // Chiffre d'affaires net d'exploitation
  const netSales = grossSales - totalCommissions;

  // Calcul du séquestre de paiement (en attente d'échéances LME 30 jours)
  const pendingSalesAmount = documents
    .filter(
      (doc) => doc.type === "Facture de Vente" && doc.status === "pending_30d",
    )
    .reduce((sum, doc) => sum + (Number(doc.amountTTC) || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Indicateurs & Trésorerie d'Exploitation
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Chiffre d'Affaires Brut */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Chiffre d'Affaires Brut
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {grossSales.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Cumul des ventes de récoltes
            </p>
          </div>

          {/* En attente d'échéances LME */}
          <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Encours de Règlement (LME)
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {pendingSalesAmount.toFixed(2)} €
                </p>
              </div>
              <Clock size={20} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-amber-700 font-bold uppercase mt-3">
              Échéance de paiement à 30 jours
            </p>
          </div>

          {/* CA Net après commissions */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Chiffre d'Affaires Net
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {netSales.toFixed(2)} €
                </p>
              </div>
              <Award size={20} className="text-emerald-600" />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Après déduction des frais de service (18%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { TrendingUp, Clock, ChevronUp, ChevronDown } from "lucide-react";

export default function BuyerIndicators({ documents = [] }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Calcul des métriques basées sur l'historique réel de Firestore
  const totalSpent = documents
    .filter((doc) => doc.status === "paid")
    .reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);

  const pendingAmount = documents
    .filter(
      (doc) => doc.status === "pending_30d" || doc.status === "pending_chorus",
    )
    .reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);

  const paidDocsCount = documents.filter((doc) => doc.status === "paid").length;
  const averageBasket = paidDocsCount > 0 ? totalSpent / paidDocsCount : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Indicateurs & Suivi des Dépenses
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
          {/* Cumul Achats */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Total Commandes Payées
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {totalSpent.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Base Factures Validées
            </p>
          </div>

          {/* En attente LME / Mandat */}
          <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Encours de Règlement
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {pendingAmount.toFixed(2)} €
                </p>
              </div>
              <Clock size={20} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-amber-700 font-bold uppercase mt-3">
              Délai LME 30j / Mandats Publics
            </p>
          </div>

          {/* Panier Moyen */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                Panier Moyen
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {averageBasket.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Hors taxes et taxes incluses
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

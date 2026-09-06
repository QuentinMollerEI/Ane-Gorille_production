import React, { useState } from "react";
import {
  TrendingUp,
  Truck,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function LivreurIndicators({ documents = [] }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Calcul dynamique basé sur l'historique réel
  const logInvoices = documents.filter((doc) => doc.type === "Note de Course");
  const completedCourses = logInvoices.filter((doc) => doc.status === "paid");

  const totalGains = completedCourses.reduce(
    (sum, doc) => sum + (Number(doc.amountTTC) || 0),
    0,
  );
  const pendingGains = logInvoices
    .filter((doc) => doc.status === "pending")
    .reduce((sum, doc) => sum + (Number(doc.amountTTC) || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Indicateurs de Prestations Logistiques
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
          {/* Courses validées */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Gains encaissés
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {totalGains.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Base prestations payées
            </p>
          </div>

          {/* Courses en cours */}
          <div className="bg-amber-50/40 p-5 rounded-xl border border-amber-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Encours de facturation
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {pendingGains.toFixed(2)} €
                </p>
              </div>
              <Truck size={20} className="text-amber-600 animate-pulse" />
            </div>
            <p className="text-[10px] text-amber-700 font-bold uppercase mt-3">
              Livraisons effectuées en attente
            </p>
          </div>

          {/* Taux de conformité HACCP */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Conformité HACCP
                </p>
                <p className="text-2xl font-black text-brand-dark">100%</p>
              </div>
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Température contrôlée (2°C-6°C)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function AdminIndicators({ orders = [] }) {
  const [isRetracted, setIsRetracted] = useState(false);

  // Calculs 100% dynamiques sur l'ensemble de l'écosystème
  const completedOrders = orders.filter(
    (order) => order.status === "PAYE" || order.status === "TERMINE",
  );
  const gmv = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || order.price || 0),
    0,
  );

  // Commission moyenne de 18% collectée par la plateforme
  const totalCommissions = completedOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || order.price || 0) * 0.15,
    0,
  );

  // Taux de réussite Chorus Pro (Commandes payées par mandat sans erreur)
  const publicOrders = orders.filter(
    (order) => order.paymentMethod === "mandat",
  );
  const successfulChorus = publicOrders.filter(
    (order) => order.status !== "rejected_chorus",
  );
  const chorusSuccessRate =
    publicOrders.length > 0
      ? (successfulChorus.length / publicOrders.length) * 100
      : 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          1. Volume d'Affaires Global (GMV) & Trésorerie
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
          {/* GMV */}
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Volume d'Affaires Global (GMV)
              </p>
              <p className="text-2xl font-black text-brand-dark">
                {gmv.toFixed(2)} €
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-3">
              Cumul des flux de vente sur la plateforme
            </p>
          </div>

          {/* Commissions récoltées */}
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Commissions Collectées (18%)
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {totalCommissions.toFixed(2)} €
                </p>
              </div>
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-3">
              Chiffre d'affaires propre de la plateforme
            </p>
          </div>

          {/* Télétransmission Chorus Pro */}
          <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-150 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                  Succès Chorus Pro
                </p>
                <p className="text-2xl font-black text-brand-dark">
                  {chorusSuccessRate.toFixed(1)}%
                </p>
              </div>
              <RefreshCw size={20} className="text-blue-600" />
            </div>
            <p className="text-[10px] text-blue-700 font-bold uppercase mt-3">
              {publicOrders.length} Dépôts de factures B2G effectués
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

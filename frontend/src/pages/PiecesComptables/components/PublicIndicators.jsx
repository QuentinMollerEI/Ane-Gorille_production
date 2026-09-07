import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";

export default function PublicIndicators({ documents }) {
  const [isRetracted, setIsRetracted] = useState(false);

  const totalDepenses = documents
    .filter((doc) => doc.type === "Facture")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalEnAttente = documents
    .filter((doc) => doc.type === "Facture" && doc.status === "pending_chorus")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          Suivi des Mandats & Trésorerie
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:bg-gray-100 p-1 rounded"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Total des engagements
            </p>
            <p className="text-3xl font-black text-gray-900">
              {totalDepenses.toFixed(2)} €
            </p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Mandats en attente LME
                </p>
                <p className="text-3xl font-black text-gray-900">
                  {totalEnAttente.toFixed(2)} €
                </p>
              </div>
              <Clock size={24} className="text-amber-500 opacity-50" />
            </div>
            <p className="text-xs text-amber-700 mt-2 font-medium">
              À acquitter via le Trésor Public (30j)[cite: 1, 8]
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-800 mb-1">
                  Pièces archivées
                </p>
                <p className="text-3xl font-black text-gray-900">
                  {documents.length}
                </p>
              </div>
              <FileText size={24} className="text-emerald-500 opacity-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

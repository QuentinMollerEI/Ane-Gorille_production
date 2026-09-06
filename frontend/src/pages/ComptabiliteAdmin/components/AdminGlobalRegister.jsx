import React, { useState } from "react";
import {
  FileText,
  Search,
  Download,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function AdminGlobalRegister({ orders = [] }) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.buyerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.producerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      methodFilter === "all" || order.paymentMethod === methodFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "PAYE":
      case "TERMINE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
            <CheckCircle size={12} /> Réglé (Stripe)
          </span>
        );
      case "A_PREPARER":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-150 text-amber-700 rounded-full text-xs font-bold">
            <Clock size={12} /> Échéance 30j LME
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          2. Registre Global des Transactions de la Plateforme (Stripe &
          Mandats)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-4 animate-fade-in">
          {/* Barre d'outils */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher par N° transaction, acheteur, maraîcher..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-600"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">Tous les modes de réglement</option>
              <option value="stripe">Carte bancaire / Stripe</option>
              <option value="mandat">Mandat Administratif B2G</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto border border-gray-250 rounded-lg shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs font-bold uppercase">
                <tr>
                  <th className="p-4">Transaction / Commande</th>
                  <th className="p-4">Acheteur Référent</th>
                  <th className="p-4">Maraîcher Destinataire</th>
                  <th className="p-4">Montant de la commande</th>
                  <th className="p-4">Frais de Plateforme (18%)</th>
                  <th className="p-4">Statut Réglement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => {
                    const orderAmount = Number(
                      order.totalAmount || order.price || 0,
                    );
                    const commission = orderAmount * 0.15;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-bold text-gray-900">
                            CMD-{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">
                            {order.paymentMethod === "mandat"
                              ? "Mandat Public"
                              : "Stripe Connect"}
                          </p>
                        </td>
                        <td className="p-4 font-semibold text-gray-800">
                          {order.buyerName || "Acheteur connecté"}
                        </td>
                        <td className="p-4 font-semibold text-gray-700">
                          {order.producerName || "Maraîcher tiers"}
                        </td>
                        <td className="p-4 font-bold text-gray-950">
                          {orderAmount.toFixed(2)} €
                        </td>
                        <td className="p-4 font-medium text-emerald-700">
                          +{commission.toFixed(2)} €
                        </td>
                        <td className="p-4">{getStatusBadge(order.status)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucune transaction répertoriée dans le système.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

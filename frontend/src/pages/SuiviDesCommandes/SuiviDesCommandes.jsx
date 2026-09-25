import React from "react";
import { Package, Search, Truck, FileText } from "lucide-react";
import { useOrderTracking } from "./hooks/useOrderTracking.js";
import OrderTimeline from "./components/OrderTimeline.jsx";
import { DeliverySlipGenerator } from "../../services/documents/DeliverySlipGenerator.js";
import { InvoiceGenerator } from "../../services/documents/InvoiceGenerator.js";

export default function SuiviDesCommandes() {
  const {
    orders,
    loading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    userRole
  } = useOrderTracking();

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-bold text-slate-500 animate-pulse">
        Chargement du suivi de vos commandes...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-700" size={24} />
            Suivi des Commandes ({userRole === "producteur" ? "Commandes Reçues" : "Mes Achats"})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Visualisez le statut de préparation, la livraison et téléchargez vos justificatifs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="N° Commande, Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="A_PREPARER">A Préparer</option>
            <option value="EN_LIVRAISON">En Livraison</option>
            <option value="LIVREE">Livrée</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
          <Package size={48} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-800">Aucune commande enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-900">
                  N° {ord.orderId || ord.subOrderId}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {ord.createdAt?.toDate ? ord.createdAt.toDate().toLocaleDateString("fr-FR") : "Aujourd'hui"}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <p><strong>Raison Sociale :</strong> {ord.buyerName || ord.buyerCompany || "Client B2B"}</p>
                {ord.producerName && <p><strong>Maraîcher / Artisan :</strong> {ord.producerName}</p>}
                <p><strong>Montant Total :</strong> <span className="font-extrabold text-emerald-800">{(ord.totals?.grandTotalTTC || ord.totalTTC || 0).toFixed(2)} € TTC</span></p>
              </div>

              <OrderTimeline status={ord.status} />

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => InvoiceGenerator.generateInvoice(ord)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={14} /> Facture PDF
                </button>
                <button
                  onClick={() => DeliverySlipGenerator.generateDeliverySlip(ord)}
                  className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Truck size={14} /> Bon de Livraison
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { db } from "../../../services/firestore.service";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  PackageCheck,
  Truck,
  Building,
  Calendar,
  Tag,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ReadyToShipCompartment.jsx
 */
export default function ReadyToShipCompartment({ subOrders = [], onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);

  const readySummary = useMemo(() => {
    const summaryMap = {};

    subOrders.forEach((sub) => {
      const items = Array.isArray(sub.items) ? sub.items : Array.isArray(sub.products) ? sub.products : [];
      items.forEach((item) => {
        const key = item.title || item.name || "Produit sans nom";
        const qty = Number(item.quantity || item.qty || 1);
        const unit = item.unit || "kg";
        const category = item.category || "Légumes";

        if (!summaryMap[key]) {
          summaryMap[key] = {
            title: key,
            totalQuantity: 0,
            unit,
            category,
            isBio: Boolean(item.isBio)
          };
        }
        summaryMap[key].totalQuantity += qty;
      });
    });

    return Object.values(summaryMap);
  }, [subOrders]);

  const handleMarkAsShipped = async (subOrder) => {
    setLoadingId(subOrder.id);
    try {
      const subRef = doc(db, "sub_orders", subOrder.id);
      await updateDoc(subRef, {
        status: "EXPEDIE",
        shippedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const parentOrderId = subOrder.orderId || subOrder.parentOrderId;
      if (parentOrderId) {
        try {
          const orderRef = doc(db, "orders", parentOrderId);
          await updateDoc(orderRef, {
            status: "in_transit",
            updatedAt: serverTimestamp()
          });
        } catch (parentErr) {
          console.warn("Mise à jour commande globale parent (in_transit) :", parentErr);
        }
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors du passage en expédition :", err);
      alert("Erreur lors de la mise à jour de la commande.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-2.5 gap-2">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <PackageCheck size={16} className="text-purple-700" />
              <span>Synthèse des Marchandises Conditionnées & Prêtes à Enlever</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Total des denrées conditionnées en caisses consignées prêtes pour la tournée du livreur.
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-mono">
            {readySummary.length} référence(s) en zone de départ
          </span>
        </div>

        {readySummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {readySummary.map((item, idx) => (
              <div key={idx} className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-gray-900 text-xs">{item.title}</span>
                    {item.isBio && (
                      <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">BIO</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{item.category}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-purple-900 block font-mono">{item.totalQuantity} {item.unit}</span>
                  <span className="text-[9px] text-purple-700 font-bold uppercase">En zone départ</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucun colis en attente d'enlèvement.
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Truck size={16} className="text-purple-700" />
            <span>Bons de Préparation Validés & Commandes Prêtes ({subOrders.length})</span>
          </h3>
        </div>

        {subOrders.length > 0 ? (
          <div className="space-y-3 pt-1">
            {subOrders.map((sub) => {
              const items = Array.isArray(sub.items) ? sub.items : Array.isArray(sub.products) ? sub.products : [];
              const isLoading = loadingId === sub.id;
              const lotNumber = sub.lotNumber || sub.batchNumber || "LOT-HACCP-STD";
              const createdDateStr = sub.createdAt?.toDate
                ? sub.createdAt.toDate().toLocaleDateString("fr-FR")
                : new Date().toLocaleDateString("fr-FR");

              return (
                <div key={sub.id} className="border border-purple-200 bg-purple-50/10 rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-purple-700" />
                        <span>Commande Prête</span>
                      </span>
                      <span className="font-extrabold text-gray-900 text-xs font-mono">
                        Réf : #{sub.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                      <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                        <Building size={13} className="text-purple-700" />
                        <span>{sub.buyerName || "Acheteur Client"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 font-mono">
                        <Calendar size={13} />
                        <span>{createdDateStr}</span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                          <th scope="col" className="p-2" aria-label="Désignation Produit">Désignation Produit</th>
                          <th scope="col" className="p-2" aria-label="Quantité Conditionnée">Quantité Conditionnée</th>
                          <th scope="col" className="p-2 text-right" aria-label="Conditionnement">Conditionnement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                        {items.map((item, idx) => {
                          const qty = Number(item.quantity ?? item.qty ?? 1);
                          return (
                            <tr key={idx} className="hover:bg-gray-50/60">
                              <td className="p-2 font-extrabold text-gray-900">{item.title || item.name}</td>
                              <td className="p-2 font-black text-purple-900 font-mono">{qty} {item.unit || "kg"}</td>
                              <td className="p-2 text-right font-mono text-gray-600">Caisse Consignée Réutilisable</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-purple-200 pt-2.5">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <Tag size={14} className="text-purple-700 shrink-0" />
                      <span className="text-gray-500 font-bold">N° Lot HACCP :</span>
                      <span className="font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{lotNumber}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkAsShipped(sub)}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Truck size={14} />}
                      <span>Confier au Livreur (Prise en Charge)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucune commande prête en zone de départ.
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { db } from "../../../services/firestore.service";
import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import CheckoutOrchestrator from "../../../services/CheckoutOrchestrator";
import {
  Sprout,
  CheckCircle,
  Tag,
  Calendar,
  Building,
  RefreshCw,
  Layers,
  ShieldCheck
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ToHarvestCompartment.jsx
 * Interface Ergonomique et Réglementaire (HACCP CE 178/2002) pour la préparation des récoltes.
 */
export default function ToHarvestCompartment({ subOrders = [], onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [lotNumbers, setLotNumbers] = useState({});

  // Synthèse globale cumulée pour la tournée aux champs
  const harvestSummary = useMemo(() => {
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

  // Générateur de lot prédictif normalisé (ex: LOT-20260919-L9VI8QF6)
  const getPredictiveLot = (sub) => {
    if (lotNumbers[sub.id]) return lotNumbers[sub.id];
    if (sub.lotNumber || sub.batchNumber) return sub.lotNumber || sub.batchNumber;
    
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const refCode = sub.id.substring(0, 8).toUpperCase();
    return `LOT-${today}-${refCode}`;
  };

  const handleLotChange = (subId, val) => {
    setLotNumbers((prev) => ({ ...prev, [subId]: val }));
  };

  // Action Unique : Valider la préparation et marquer "Commande Prête"
  const handleValidatePreparation = async (subOrder) => {
    const finalLot = getPredictiveLot(subOrder).trim();
    setLoadingId(subOrder.id);

    try {
      if (CheckoutOrchestrator && typeof CheckoutOrchestrator.validatePreparation === "function") {
        await CheckoutOrchestrator.validatePreparation(subOrder, finalLot);
      } else {
        const subRef = doc(db, "sub_orders", subOrder.id);
        await updateDoc(subRef, {
          status: "A_RAMASSER",
          lotNumber: finalLot,
          batchNumber: finalLot,
          preparedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const parentOrderId = subOrder.parentOrderId || subOrder.orderId || subOrder.mainOrderId;
        if (parentOrderId) {
          const qSiblings = query(collection(db, "sub_orders"), where("orderId", "==", parentOrderId));
          const snap = await getDocs(qSiblings);
          const allSubs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          const allReady = allSubs.length > 0 && allSubs.every((s) =>
            s.id === subOrder.id || ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(s.status)
          );

          const newOrderStatus = allReady ? "ready_for_pickup" : "preparing";
          const orderRef = doc(db, "orders", parentOrderId);
          await updateDoc(orderRef, {
            status: newOrderStatus,
            updatedAt: serverTimestamp()
          });
        }
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la validation de la récolte :", err);
      alert("Erreur lors de la mise à jour de la commande.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 📋 1. SYNTHÈSE CUMULÉE DE CUEILLETTE AUX CHAMPS */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-2.5 gap-2">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Sprout size={16} className="text-emerald-700" />
              <span>Synthèse Globale de Cueillette du Jour</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Quantités totales cumulées à récolter aux champs pour l'ensemble des commandes actives.
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
            {harvestSummary.length} référence(s) à cueillir
          </span>
        </div>

        {harvestSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {harvestSummary.map((item, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
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
                  <span className="text-sm font-black text-emerald-900 block font-mono">{item.totalQuantity} {item.unit}</span>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase">À Cueillir</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucun produit à récolter actuellement.
          </div>
        )}
      </div>

      {/* 📦 2. BONS DE PRÉPARATION B2B / B2G */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-emerald-700" />
            <span>Bons de Préparation par Client ({subOrders.length})</span>
          </h3>
          <span className="text-[10px] text-gray-500 font-extrabold uppercase flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-700" />
            <span>Traçabilité CE 178/2002</span>
          </span>
        </div>

        {subOrders.length > 0 ? (
          <div className="space-y-3 pt-1">
            {subOrders.map((sub) => {
              const items = Array.isArray(sub.items) ? sub.items : Array.isArray(sub.products) ? sub.products : [];
              const isLoading = loadingId === sub.id;
              const currentLot = getPredictiveLot(sub);

              const createdDateStr = sub.createdAt?.toDate
                ? sub.createdAt.toDate().toLocaleDateString("fr-FR")
                : new Date().toLocaleDateString("fr-FR");

              return (
                <div key={sub.id} className="border border-gray-200 rounded-xl p-3.5 bg-white space-y-3 shadow-2xs hover:border-gray-300 transition-colors">
                  {/* En-tête du Bon */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-blue-100 text-blue-900 border-blue-200">
                        À Préparer
                      </span>
                      <span className="font-extrabold text-gray-900 text-xs font-mono">
                        Réf : #{sub.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                      <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                        <Building size={13} className="text-emerald-700" />
                        <span>{sub.buyerName || "Acheteur Client"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 font-mono">
                        <Calendar size={13} />
                        <span>{createdDateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Tableau des articles */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                          <th scope="col" className="p-2" aria-label="Désignation">Désignation</th>
                          <th scope="col" className="p-2" aria-label="Quantité à Conditionner">Quantité à Conditionner</th>
                          <th scope="col" className="p-2" aria-label="Prix HT">Prix HT</th>
                          <th scope="col" className="p-2 text-right" aria-label="Montant HT">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                        {items.map((item, idx) => {
                          const pHT = Number(item.priceHT ?? item.price ?? 0);
                          const qty = Number(item.quantity ?? item.qty ?? 1);
                          return (
                            <tr key={idx} className="hover:bg-gray-50/60">
                              <td className="p-2 font-extrabold text-gray-900">
                                {item.title || item.name}
                                {item.isBio && (
                                  <span className="ml-1 bg-amber-100 text-amber-900 font-black text-[8px] px-1 py-0.2 rounded uppercase">BIO</span>
                                )}
                              </td>
                              <td className="p-2 font-black text-emerald-900 font-mono">{qty} {item.unit || "kg"}</td>
                              <td className="p-2 text-gray-600 font-mono">{pHT.toFixed(2)} € HT</td>
                              <td className="p-2 text-right font-black text-gray-900 font-mono">{(pHT * qty).toFixed(2)} € HT</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Zone d'action guidée : BOUTON UNIQUE DIRECT */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <Tag size={15} className="text-emerald-700 shrink-0" />
                        <div className="w-full sm:w-72">
                          <label className="text-[9px] font-extrabold uppercase text-gray-600 block mb-0.5">
                            N° de Lot Sanitaire HACCP (Auto-généré) *
                          </label>
                          <input
                            type="text"
                            value={currentLot}
                            onChange={(e) => handleLotChange(sub.id, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-1.5 font-black text-gray-900 focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-mono shadow-2xs"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleValidatePreparation(sub)}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ring-2 ring-emerald-200"
                      >
                        {isLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                        <span>Valider — Commande Prête</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucun bon de préparation en attente.
          </div>
        )}
      </div>
    </div>
  );
}
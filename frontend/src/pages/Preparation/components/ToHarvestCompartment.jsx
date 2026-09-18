import React, { useState, useMemo } from "react";
import { db } from "../../../services/firestore.service";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Sprout,
  PackageCheck,
  CheckCircle,
  Tag,
  Calendar,
  Building,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Layers
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ToHarvestCompartment.jsx
 * Onglet "À Récolter / À Préparer" pour les maraîchers et producteurs.
 * 
 * Fonctionnalités :
 * 1. Synthèse globale de récolte cumulée par produit (Quantités totales à cueillir aux champs).
 * 2. Liste détaillée des sous-commandes par acheteur (B2B / B2G).
 * 3. Saisie du N° de lot sanitaire HACCP et validation de la préparation.
 */
export default function ToHarvestCompartment({ subOrders = [], onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);
  const [lotNumbers, setLotNumbers] = useState({});

  // 1. Calcul de la synthèse globale des récoltes (Cumul des quantités par produit)
  const harvestSummary = useMemo(() => {
    const summaryMap = {};

    subOrders.forEach((sub) => {
      const items = Array.isArray(sub.items) ? sub.items : [];
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

  // Gestionnaire de saisie locale du N° de lot sanitaire par sous-commande
  const handleLotChange = (subId, val) => {
    setLotNumbers((prev) => ({ ...prev, [subId]: val }));
  };

  // Action : Valider la préparation d'une sous-commande
  const handleValidatePreparation = async (subOrder) => {
    const defaultLot =
      `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalLot = (lotNumbers[subOrder.id] || subOrder.lotNumber || subOrder.batchNumber || defaultLot).trim();

    setLoadingId(subOrder.id);

    try {
      const subRef = doc(db, "sub_orders", subOrder.id);
      await updateDoc(subRef, {
        status: "A_RAMASSER",
        lotNumber: finalLot,
        batchNumber: finalLot,
        preparedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erreur lors de la validation de la récolte :", err);
      alert("Erreur lors de la mise à jour de la commande.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* 📋 1. SYNTHÈSE CUMULÉE DE CUEILLETTE (LISTE POUR LES CHAMPS) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-150 pb-2.5 gap-2">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Sprout size={16} className="text-emerald-700" />
              <span>Synthèse Globale de Cueillette du Jour</span>
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Quantités totales cumulées à récolter sur l'exploitation pour l'ensemble des commandes actives.
            </p>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            {harvestSummary.length} référence(s) à cueillir
          </span>
        </div>

        {harvestSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {harvestSummary.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-md flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-gray-900 text-xs">{item.title}</span>
                    {item.isBio && (
                      <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1 py-0.2 rounded uppercase">
                        BIO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{item.category}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-900 block">
                    {item.totalQuantity} {item.unit}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase">À Récolter</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-gray-50 rounded-md border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucun produit à récolter actuellement.
          </div>
        )}
      </div>

      {/* 📦 2. LISTE DÉTAILLÉE DES BONS DE PRÉPARATION PAR ACHETEUR */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-emerald-700" />
            <span>Bons de Préparation par Commande Client ({subOrders.length})</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Traçabilité HACCP CE 178/2002</span>
        </div>

        {subOrders.length > 0 ? (
          <div className="space-y-3 pt-1">
            {subOrders.map((sub) => {
              const items = Array.isArray(sub.items) ? sub.items : [];
              const totalAmount = Number(sub.amount || sub.totalAmount || 0);
              const isLoading = loadingId === sub.id;
              const currentLot =
                lotNumbers[sub.id] !== undefined
                  ? lotNumbers[sub.id]
                  : sub.lotNumber || sub.batchNumber || "";

              const createdDateStr = sub.createdAt?.toDate
                ? sub.createdAt.toDate().toLocaleDateString("fr-FR")
                : new Date().toLocaleDateString("fr-FR");

              return (
                <div
                  key={sub.id}
                  className="border border-gray-200 rounded-lg p-3.5 bg-white space-y-3 shadow-2xs hover:border-gray-300 transition-colors"
                >
                  {/* En-tête de la sous-commande */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        À Préparer
                      </span>
                      <span className="font-extrabold text-gray-900 text-xs">
                        Réf : #{sub.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600">
                      <span className="flex items-center gap-1 text-gray-800 font-extrabold">
                        <Building size={13} className="text-emerald-700" />
                        <span>{sub.buyerName || "Acheteur Client"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar size={13} />
                        <span>{createdDateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Tableau des articles inclus dans ce bon de préparation */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[9px] tracking-wider">
                          <th className="p-2">Désignation</th>
                          <th className="p-2">Quantité à Conditionner</th>
                          <th className="p-2">Prix HT</th>
                          <th className="p-2 text-right">Montant HT</th>
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
                                  <span className="ml-1 bg-amber-100 text-amber-900 font-black text-[8px] px-1 py-0.2 rounded uppercase">
                                    BIO
                                  </span>
                                )}
                              </td>
                              <td className="p-2 font-black text-emerald-900">
                                {qty} {item.unit || "kg"}
                              </td>
                              <td className="p-2 text-gray-600">{pHT.toFixed(2)} € HT</td>
                              <td className="p-2 text-right font-black text-gray-900">
                                {(pHT * qty).toFixed(2)} € HT
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Zone de scellement du N° de Lot Sanitaire & Validation */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-md border border-gray-200 pt-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                      <Tag size={14} className="text-emerald-700 shrink-0" />
                      <div className="w-full sm:w-64">
                        <label className="text-[9px] font-extrabold uppercase text-gray-600 block mb-0.5">
                          N° de Lot Sanitaire HACCP *
                        </label>
                        <input
                          type="text"
                          placeholder="ex: LOT-2026-TOM01"
                          value={currentLot}
                          onChange={(e) => handleLotChange(sub.id, e.target.value)}
                          className="w-full border border-gray-300 rounded p-1.5 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleValidatePreparation(sub)}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-md text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      <span>Valider & Marquer Prêt à Expédier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-md border border-dashed border-gray-200 text-gray-400 font-bold italic">
            Aucun bon de préparation en attente.
          </div>
        )}
      </div>
    </div>
  );
}

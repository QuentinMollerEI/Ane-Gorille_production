import React, { useState } from "react";
import { 
  CheckCircle2, 
  Calendar, 
  Printer, 
  X, 
  ShieldCheck, 
  FileText, 
  CheckSquare,
  Square
} from "lucide-react";
import { formatFrenchDate } from "../../../utils/deliveryCalendar.js";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";

/**
 * 📜 COMPOSANT MODAL : PreparationSlipModal.jsx
 * Emplacement : src/pages/Preparation/components/PreparationSlipModal.jsx
 * 
 * Fiche de Récolte & Bon de Préparation Interactif :
 * - Pointage ligne par ligne des produits cueillis aux champs (Produits décochés par défaut = 0%)
 * - Extraction robuste des quantités (item.quantity ?? item.qty ?? item.count)
 * - Saisie dynamique du N° de Lot HACCP & Nombre de cagettes consignées
 * - Validation en 1 clic avec mise à jour automatique Firestore (sub_orders)
 */
export default function PreparationSlipModal({ order, parentOrder, onClose, onValidateSuccess }) {
  if (!order) return null;

  const defaultLot = order.lotNumber || `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
  const [lotNumber, setLotNumber] = useState(defaultLot);
  const [crateCount, setCrateCount] = useState(order.crateCount || 1);
  const [remarks, setRemarks] = useState(order.preparationNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper d'extraction robuste de la quantité
  const getItemQty = (item) => {
    if (!item) return 0;
    const val = item.quantity ?? item.qty ?? item.count ?? item.preparedQty ?? item.qtyPrepared ?? item.orderedQty;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Helper d'extraction d'unité
  const getItemUnit = (item) => {
    if (!item) return "kg";
    return item.unit || item.unite || item.unitLabel || "kg";
  };

  // État local de pointage des articles (décochés par défaut = prepared: false)
  const initialItemsState = (order.items || []).map((item) => ({
    ...item,
    prepared: item.prepared !== undefined ? Boolean(item.prepared) : false
  }));

  const [items, setItems] = useState(initialItemsState);

  // Calcul du taux de complétion
  const preparedCount = items.filter(i => i.prepared).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 0;

  const toggleItemPrepared = (index) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, prepared: !item.prepared } : item
      )
    );
  };

  const handleSelectAll = (checkState = true) => {
    setItems((prev) => prev.map((item) => ({ ...item, prepared: checkState })));
  };

  const reqDate = order.selectedDate || parentOrder?.selectedDate || parentOrder?.deliveryDate || order.deliveryDate || "Non spécifiée";
  const dateFormatted = reqDate !== "Non spécifiée" 
    ? (reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate) 
    : "À définir";

  const buyerName = order.buyerCompany || order.buyerName || parentOrder?.buyerCompany || parentOrder?.buyerName || "Acheteur Client Pro";
  const deliveryAddress = order.deliveryAddress || parentOrder?.deliveryAddress || "Adresse de livraison non renseignée";

  // Validation finale & Mise à jour automatique de la commande
  const handleValidateAndSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSubmitting(true);
    try {
      const finalLot = lotNumber.trim() || defaultLot;
      const finalCrates = Number(crateCount) || 1;

      if (typeof onValidateSuccess === "function") {
        await onValidateSuccess(order.id, finalLot, finalCrates, items, remarks);
      }
      onClose();
    } catch (err) {
      console.error("Erreur validation fiche de préparation :", err);
      alert("Une erreur est survenue lors de la validation de la préparation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Impression de la fiche A4
  const handlePrint = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const html = OrderDocumentGenerator.generatePreparationSlipHTML({
        ...order,
        lotNumber: lotNumber || defaultLot,
        crateCount: crateCount,
        items: items
      }, parentOrder);

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
      }
    } catch (e) {
      console.error("Erreur impression fiche A4 :", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto text-xs font-sans text-slate-800 relative">
        
        {/* BOUTON FERMER */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer z-10"
          title="Fermer"
        >
          <X size={18} />
        </button>

        {/* EN-TÊTE BON DE PRÉPARATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-800/20 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <span>Âne &amp; Gorille · Quentin Moller EI</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
              <FileText className="text-emerald-700" size={22} /> Fiche de Récolte &amp; Bon de Préparation
            </h2>
            <p className="text-slate-500 font-mono font-bold text-xs mt-0.5">
              Ordre N° #{order.id?.substring(0, 8).toUpperCase()} · Réf Parent : #{order.parentOrderId?.substring(0, 8).toUpperCase() || 'CMD-PRO'}
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 text-emerald-900 shrink-0 self-start sm:self-auto">
            <Calendar size={18} className="text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase block leading-none">Livraison Cible</span>
              <strong className="text-xs font-mono font-black text-emerald-950">{dateFormatted}</strong>
            </div>
          </div>
        </div>

        {/* CARTES ADRESSES & CONFORMITÉ LÉGALE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Acheteur Destinataire
            </span>
            <p className="font-extrabold text-slate-900 text-xs">{buyerName}</p>
            <p className="text-slate-600 text-[11px] leading-relaxed">{deliveryAddress}</p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={13} className="text-amber-700" /> Exigences Sanitaires &amp; Loi AGEC
            </span>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
              • Conservation Chaîne du Froid : <strong>+2°C à +4°C</strong><br />
              • Emballage : Cagettes Plastique Pro Réutilisables Consignées
            </p>
          </div>
        </div>

        {/* BARRE DE PROGRESSION DU POINTAGE DE RÉCOLTE */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span className="text-slate-700 flex items-center gap-1.5">
              <CheckSquare size={15} className="text-emerald-700" /> Pointage &amp; Cueillette aux Champs
            </span>
            <span className="font-mono text-emerald-800">
              {preparedCount} / {totalCount} produit(s) cueilli(s) ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-500 font-medium">
              Cochez les produits au fur et à mesure de la récolte aux champs.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Tout cocher (100%)
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-slate-500 font-bold hover:underline cursor-pointer"
              >
                Tout décocher
              </button>
            </div>
          </div>
        </div>

        {/* TABLEAU INTERACTIF DES PRODUITS DE LA COMMANDE */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-2.5 text-center w-10">État</th>
                <th className="p-2.5">Produit à Récolter</th>
                <th className="p-2.5 text-center">Quantité Commandée</th>
                <th className="p-2.5">Conditionnement Exigé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const qty = getItemQty(item);
                const unit = getItemUnit(item);
                return (
                  <tr 
                    key={idx} 
                    onClick={() => toggleItemPrepared(idx)}
                    className={`cursor-pointer transition-colors ${
                      item.prepared ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      {item.prepared ? (
                        <CheckSquare size={18} className="text-emerald-700 inline-block" />
                      ) : (
                        <Square size={18} className="text-slate-300 inline-block" />
                      )}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      <span className={item.prepared ? "line-through text-slate-500" : ""}>
                        {item.name || item.title}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-black text-emerald-900 font-mono text-sm">
                      {qty} {unit}
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">
                      Cagette Plastique Pro Consignée (HACCP)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PARAMÈTRES DE TRAÇABILITÉ : LOT HACCP & CAGETTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              N° Lot Sanitaire HACCP Attribué *
            </label>
            <div className="relative">
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="ex: LOT-20260922"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Règlement CE 178/2002 &amp; CE 543/2011 (Traçabilité sanitaire obligatoire).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              Nombre de Cagettes Consignées *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={crateCount}
                onChange={(e) => setCrateCount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Emballages consignés prêts pour enlèvement par le livreur Âne &amp; Gorille.
            </p>
          </div>
        </div>

        {/* REMARQUES OPTIONNELLES */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
            Remarques / Observations de Récolte (Optionnel)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Précisions sur la cueillette, qualité du lot, instructions chauffeur..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* BOUTONS D'ACTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Printer size={16} className="text-emerald-800" />
            <span>Imprimer Fiche A4 (PDF)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleValidateAndSubmit}
              className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "Validation..." : "✓ Valider la Préparation & Actualiser la Commande"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

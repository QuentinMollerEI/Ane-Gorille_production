import React, { useState, useEffect, useMemo } from "react";
import { Sprout, CheckCircle2, Clock, Calendar, Package, AlertCircle, Printer, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";
import { startHarvest, validatePreparation } from "../../../services/CheckoutOrchestrator";
import { OrderDocumentGenerator } from "../../../services/OrderDocumentGenerator";
import { formatFrenchDate, getCalculatedDeliveryDate, formatDateToYYYYMMDD } from "../../../utils/deliveryCalendar.js";

/**
 * 🌾 COMPOSANT : ToHarvestCompartment.jsx
 * Espace Récolte & Préparation pour les Maraîchers.
 * Affiche de façon proéminente la DATE DE LIVRAISON SOUHAITÉE (11j livrables) par l'acheteur sur chaque fiche.
 */
export default function ToHarvestCompartment() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [parentOrdersMap, setParentOrdersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubId, setExpandedSubId] = useState(null);
  
  const [selectedDateFilter, setSelectedDateFilter] = useState(formatDateToYYYYMMDD(new Date()));
  const [lotNumbers, setLotNumbers] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Écoute les sous-commandes destinées à ce maraîcher
    const qSubs = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid)
    );

    const unsubSubs = onSnapshot(
      qSubs,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de chargement récoltes :", err);
        setError("Impossible de charger vos bons de préparation.");
        setLoading(false);
      }
    );

    // 2. Écoute globale des commandes parentes pour la jointure de sécurité
    const qOrders = query(collection(db, "orders"));
    const unsubOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data();
        });
        setParentOrdersMap(map);
      },
      (err) => console.error("Erreur sync commandes parentes :", err)
    );

    return () => {
      unsubSubs();
      unsubOrders();
    };
  }, [user?.uid]);

  // Extraction exacte de la date de livraison souhaitée avec fallback calculé si manquant
  const getSubOrderDeliveryDate = (sub) => {
    const parentDoc = parentOrdersMap[sub.parentOrderId || sub.orderId];
    const rawDate = sub.selectedDate ||
                    parentDoc?.selectedDate ||
                    sub.deliveryDate ||
                    parentDoc?.deliveryDate ||
                    sub.deliveryDetails?.selectedDate ||
                    parentDoc?.deliveryDetails?.selectedDate;

    if (rawDate && rawDate !== "Non spécifiée" && rawDate !== "") {
      return rawDate;
    }

    const refDate = sub.createdAt?.toDate ? sub.createdAt.toDate() : new Date();
    return getCalculatedDeliveryDate(refDate);
  };

  // Liste récapitulative des dates de livraison actives pour ce maraîcher
  const activeDatesList = useMemo(() => {
    const datesMap = {};
    subOrders.forEach((sub) => {
      const dt = getSubOrderDeliveryDate(sub);
      if (dt) {
        datesMap[dt] = (datesMap[dt] || 0) + 1;
      }
    });
    return Object.keys(datesMap).sort().map(d => ({ date: d, count: datesMap[d] }));
  }, [subOrders, parentOrdersMap]);

  // Auto-sélection de la première date active si disponible
  useEffect(() => {
    if (activeDatesList.length > 0 && (!selectedDateFilter || !activeDatesList.some(d => d.date === selectedDateFilter))) {
      setSelectedDateFilter(activeDatesList[0].date);
    }
  }, [activeDatesList]);

  // Filtrage des sous-commandes par date
  const filteredSubOrders = useMemo(() => {
    return subOrders.filter((sub) => {
      if (selectedDateFilter && selectedDateFilter !== "ALL") {
        return getSubOrderDeliveryDate(sub) === selectedDateFilter;
      }
      return true;
    });
  }, [subOrders, parentOrdersMap, selectedDateFilter]);

  const toggleExpand = (subId) => {
    setExpandedSubId((prev) => (prev === subId ? null : subId));
  };

  // Action : Démarrage Récolte
  const handleStartHarvest = async (e, subId) => {
    if (e) e.stopPropagation();
    setProcessingId(subId);
    try {
      await startHarvest(subId);
    } catch (err) {
      alert("Erreur lors du démarrage de la récolte : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Action : Validation Cagette & N° de Lot HACCP
  const handleValidatePreparation = async (e, subOrder) => {
    if (e) e.stopPropagation();
    setProcessingId(subOrder.id);
    try {
      const userLot = lotNumbers[subOrder.id];
      await validatePreparation(subOrder, userLot);
      alert("Préparation validée ! Les colis sont marqués prêts pour le ramassage camion.");
    } catch (err) {
      alert("Erreur lors de la validation : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Imprimer le Bon de Préparation
  const handlePrintSlip = (e, subOrder) => {
    if (e) e.stopPropagation();
    const parentDoc = parentOrdersMap[subOrder.parentOrderId || subOrder.orderId];
    const enrichedSub = {
      ...subOrder,
      selectedDate: getSubOrderDeliveryDate(subOrder),
      buyerName: subOrder.buyerName || parentDoc?.buyerName || "Acheteur Client",
      deliveryAddress: subOrder.deliveryAddress || parentDoc?.deliveryAddress || "Adresse de livraison"
    };
    const html = OrderDocumentGenerator.generatePreparationSlipHTML(enrichedSub);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs font-semibold text-emerald-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        <span>Chargement de votre cahier de récolte...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 text-xs font-sans text-slate-800">
      {/* En-tête Maraîcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sprout className="text-emerald-700" size={22} /> Cahier de Récolte & Préparation
          </h1>
          <p className="text-xs text-slate-500">
            Organisez vos cueillies en fonction des <strong className="text-slate-900">dates de livraison souhaitées par vos acheteurs (11j livrables)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-md text-[11px] font-extrabold">
          <ShieldCheck size={14} className="text-emerald-700" />
          <span>Traçabilité Sanitaire HACCP</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Barre de Sélection de la Date de Livraison Souhaitée */}
      <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar size={15} className="text-emerald-700" />
            <span>Sélectionner la Date de Livraison Souhaitée</span>
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            {filteredSubOrders.length} fiche(s) pour le <strong className="text-slate-900">{formatFrenchDate(selectedDateFilter)}</strong>
          </span>
        </div>

        {activeDatesList.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeDatesList.map(({ date, count }) => {
              const isSelected = selectedDateFilter === date;
              const formatted = formatFrenchDate(date);

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDateFilter(date)}
                  className={`px-3.5 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  <span className="capitalize">{formatted}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                      isSelected ? "bg-white text-emerald-900" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedDateFilter("ALL")}
              className={`px-3 py-2 rounded-md font-bold text-xs transition-colors cursor-pointer border ${
                selectedDateFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              Toutes les dates
            </button>
          </div>
        ) : (
          <p className="text-slate-400 italic text-xs">Aucune commande enregistrée à ce jour.</p>
        )}
      </div>

      {/* LISTE DES BONS DE PRÉPARATION */}
      {filteredSubOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
          Aucun produit à récolter pour la date du <strong>{formatFrenchDate(selectedDateFilter)}</strong>.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
          {/* EN-TÊTE DU TABLEAU HARMONISÉ */}
          <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
            <div className="min-w-[180px]">Réf Préparation &amp; Statut</div>
            <div className="flex items-center gap-4">
              <div className="w-[110px]">Date Commande</div>
              <div className="w-[130px] text-emerald-800 font-extrabold flex items-center gap-1">
                <span>Date Livraison</span>
              </div>
              <div className="w-[130px]">Client / Acheteur</div>
              <div className="w-[60px]">Articles</div>
              <div className="w-[110px]">N° Lot HACCP</div>
              <div className="w-[90px] text-right">Total HT</div>
              <div className="w-[24px]"></div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredSubOrders.map((sub) => {
              const isExpanded = expandedSubId === sub.id;
              const reqDate = getSubOrderDeliveryDate(sub);
              const formattedReqDate = formatFrenchDate(reqDate);

              const isReady = ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(sub.status);
              const isHarvesting = sub.status === "HARVESTING";

              return (
                <React.Fragment key={sub.id}>
                  {/* LIGNE DE SOUS-COMMANDE HARMONISÉE */}
                  <div
                    onClick={() => toggleExpand(sub.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-3 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 sm:gap-0"
                  >
                    {/* 1. Réf Sous-Commande & Statut */}
                    <div className="min-w-[180px] flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono">
                        #{sub.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isReady ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isHarvesting ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {isReady ? 'Prêt Camion' : isHarvesting ? 'Cueillie' : 'À Préparer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* 2. Date Commande */}
                      <div className="w-[110px] text-slate-600 font-sans text-xs">
                        {sub.createdAt?.toDate 
                          ? sub.createdAt.toDate().toLocaleDateString('fr-FR')
                          : formatDateToYYYYMMDD(new Date()).split('-').reverse().join('/')}
                      </div>

                      {/* 3. Date Livraison Souhaitée - Badge Vert */}
                      <div className="w-[130px] font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/80 flex items-center gap-1.5 text-[11px] font-mono shadow-xs">
                        <Calendar size={13} className="text-emerald-700 shrink-0" />
                        <span>
                          {reqDate.includes('-') ? reqDate.split('-').reverse().join('/') : reqDate}
                        </span>
                      </div>

                      {/* 4. Client / Acheteur */}
                      <div className="w-[130px] font-bold text-slate-900 truncate" title={sub.buyerName}>
                        {sub.buyerName || 'Client Pro'}
                      </div>

                      {/* 5. Articles */}
                      <div className="w-[60px] text-slate-700 font-bold">
                        {sub.items?.length || 0} art.
                      </div>

                      {/* 6. N° Lot HACCP */}
                      <div className="w-[110px] font-mono font-bold text-slate-700 text-[11px] truncate">
                        {sub.lotNumber || sub.batchNumber || 'À renseigner'}
                      </div>

                      {/* 7. Total HT */}
                      <div className="w-[90px] text-right font-black text-slate-900 font-mono">
                        {Number(sub.amountHT || sub.totalAmount || 0).toFixed(2)} €
                      </div>

                      {/* 8. Action (Chevron) */}
                      <div className="w-[24px] flex justify-end text-slate-400 hover:text-emerald-700 cursor-pointer">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* PANNEAU DÉPLIABLE D'ACCORDÉON POUR LE MARAÎCHER */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 p-4 border-t border-slate-200 space-y-3">
                      {/* Badge Date & Impression Bon de Préparation */}
                      <div className="bg-emerald-50 border border-emerald-300 rounded p-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={20} className="text-emerald-700" />
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                              DATE DE LIVRAISON SOUHAITÉE PAR L'ACHETEUR
                            </span>
                            <span className="text-sm font-black text-emerald-950 capitalize">
                              {formattedReqDate} ({reqDate.split('-').reverse().join('/')})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handlePrintSlip(e, sub)}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer size={13} />
                          <span>Imprimer Bon de Préparation</span>
                        </button>
                      </div>

                      {/* Produits à Cueillir */}
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Package size={13} className="text-emerald-700" /> Produits à Conditionner :
                        </span>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white p-2">
                          {(sub.items || []).map((item, idx) => (
                            <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">{item.name || item.title}</span>
                              <span className="font-black text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {item.quantity || item.qty} {item.unit || "kg"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Zone d'Action Maraîcher & N° de Lot HACCP */}
                      <div className="pt-2 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <label className="font-extrabold text-slate-700 text-[11px]">N° Lot HACCP :</label>
                          <input
                            type="text"
                            disabled={isReady}
                            placeholder="Ex: LOT-2026-8812"
                            value={lotNumbers[sub.id] ?? sub.lotNumber ?? ""}
                            onChange={(e) => setLotNumbers({ ...lotNumbers, [sub.id]: e.target.value })}
                            className="p-1.5 border border-slate-300 rounded font-mono text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 w-44"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {!isHarvesting && !isReady && (
                            <button
                              type="button"
                              disabled={processingId === sub.id}
                              onClick={(e) => handleStartHarvest(e, sub.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Clock size={14} />
                              <span>Démarrer la Cueillie</span>
                            </button>
                          )}

                          {!isReady ? (
                            <button
                              type="button"
                              disabled={processingId === sub.id}
                              onClick={(e) => handleValidatePreparation(e, sub)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                            >
                              <CheckCircle2 size={14} />
                              <span>Valider les Cagettes (Prêt Camion)</span>
                            </button>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded font-extrabold text-xs flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-700" />
                              <span>Prêt pour le Camion (Lot : {sub.lotNumber || "HACCP"})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Package, Calendar, Printer, Truck, Clock, CheckCircle2, AlertCircle, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { OrderDocumentGenerator } from "../../services/OrderDocumentGenerator";
import { formatFrenchDate, getCalculatedDeliveryDate, formatDateToYYYYMMDD } from "../../utils/deliveryCalendar.js";

/**
 * 🛒 COMPOSANT : SuiviDesCommandes.jsx
 * Espace Suivi de Commandes pour l'Acheteur Client.
 * Affiche de manière proéminente la DATE DE LIVRAISON SOUHAITÉE (11j livrables) sur chaque commande.
 */
export default function SuiviDesCommandes() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Écoute des commandes globales
    const qOrders = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(data);
      },
      (err) => console.error("Erreur commandes :", err)
    );

    // 2. Écoute des sous-commandes
    const qSubs = query(collection(db, "sub_orders"), where("buyerId", "==", user.uid));
    const unsubSubs = onSnapshot(
      qSubs,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSubOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur sous-commandes :", err);
        setError("Impossible de charger l'historique de vos commandes.");
        setLoading(false);
      }
    );

    return () => {
      unsubOrders();
      unsubSubs();
    };
  }, [user?.uid]);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // Imprimer le Bon de Commande
  const handlePrintOrderSlip = (e, order) => {
    if (e) e.stopPropagation();
    const html = OrderDocumentGenerator.generateOrderSlipHTML(order);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // Imprimer le Bon de Livraison (BL)
  const handlePrintDeliverySlip = (e, order) => {
    if (e) e.stopPropagation();
    const html = OrderDocumentGenerator.generateDeliverySlipHTML(order);
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
        <span>Chargement de vos commandes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 text-xs font-sans text-slate-800">
      {/* En-tête Suivi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-700" size={22} /> Suivi des Commandes Acheteur
          </h1>
          <p className="text-xs text-slate-500">
            Consultez l'état d'avancement et les <strong className="text-slate-900">dates de livraison programmées</strong>.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-medium">
          Vous n'avez pas encore passé de commande sur la plateforme.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
          {/* EN-TÊTE DU TABLEAU AVEC COLONNE DATE LIVRAISON */}
          <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-[11px] text-slate-600 uppercase tracking-wider">
            <div className="min-w-[180px]">Réf Commande &amp; Statut</div>
            <div className="flex items-center gap-4">
              <div className="w-[110px]">Date Commande</div>
              <div className="w-[130px] text-emerald-800 font-extrabold flex items-center gap-1">
                <span>Date Livraison</span>
              </div>
              <div className="w-[130px]">Client / Acheteur</div>
              <div className="w-[60px]">Articles</div>
              <div className="w-[110px]">Règlement</div>
              <div className="w-[90px] text-right">Total TTC</div>
              <div className="w-[24px]"></div>
            </div>
          </div>

          {/* LISTE DES COMMANDES */}
          <div className="divide-y divide-slate-200">
            {orders.map((ord) => {
              const isExpanded = expandedOrderId === ord.id;
              const rawDate = ord.selectedDate || ord.deliveryDate || ord.deliveryDetails?.selectedDate;
              const reqDate = (rawDate && rawDate !== "Date en attente" && rawDate !== "")
                ? rawDate
                : getCalculatedDeliveryDate(ord.createdAt?.toDate ? ord.createdAt.toDate() : new Date());

              const formattedReqDate = formatFrenchDate(reqDate);

              // Filtre les sous-commandes de cette commande parente
              const associatedSubs = subOrders.filter((s) => s.parentOrderId === ord.id || s.orderId === ord.id);

              return (
                <React.Fragment key={ord.id}>
                  {/* LIGNE DE COMMANDES DYNAMIQUE */}
                  <div
                    onClick={() => toggleExpand(ord.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-3 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer gap-2 sm:gap-0"
                  >
                    {/* 1. Réf Commande & Statut */}
                    <div className="min-w-[180px] flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono">
                        #{ord.orderNumber || ord.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        ord.status === 'paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {ord.status === 'delivered' ? 'Livré' : ord.status === 'paid' ? 'Payé' : 'En cours'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* 2. Date Commande */}
                      <div className="w-[110px] text-slate-600 font-sans text-xs">
                        {ord.createdAt?.toDate 
                          ? ord.createdAt.toDate().toLocaleDateString('fr-FR')
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
                      <div className="w-[130px] font-bold text-slate-900 truncate" title={ord.buyerName}>
                        {ord.buyerName || 'Acheteur Pro'}
                      </div>

                      {/* 5. Articles */}
                      <div className="w-[60px] text-slate-700 font-bold">
                        {ord.items?.length || 0} art.
                      </div>

                      {/* 6. Règlement */}
                      <div className="w-[110px] text-slate-600 truncate text-[11px]">
                        {ord.paymentMethod === 'mandat_public' ? 'Mandat Chorus' : 'Stripe B2B'}
                      </div>

                      {/* 7. Total TTC */}
                      <div className="w-[90px] text-right font-black text-slate-900 font-mono">
                        {Number(ord.totalTTC || ord.totalAmount || ord.amount || 0).toFixed(2)} €
                      </div>

                      {/* 8. Action (Chevron) */}
                      <div className="w-[24px] flex justify-end text-slate-400 hover:text-emerald-700 cursor-pointer">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* PANNEAU DÉPLIABLE D'ACCORDÉON */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 p-4 border-t border-slate-200 space-y-3">
                      {/* Badge Date & Impression Documents */}
                      <div className="bg-emerald-50 border border-emerald-300 rounded p-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={20} className="text-emerald-700" />
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                              DATE DE LIVRAISON SOUHAITÉE PAR VOS SOINS
                            </span>
                            <span className="text-sm font-black text-emerald-950 capitalize">
                              {formattedReqDate} ({reqDate.split('-').reverse().join('/')})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handlePrintOrderSlip(e, ord)}
                            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>Bon de Commande</span>
                          </button>

                          {ord.status === "delivered" && (
                            <button
                              type="button"
                              onClick={(e) => handlePrintDeliverySlip(e, ord)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer size={13} />
                              <span>Bon de Livraison (BL)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* État de Préparation par Maraîcher */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Truck size={13} className="text-emerald-700" /> Avancement par Maraîcher :
                        </span>
                        <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1 divide-y divide-slate-100">
                          {associatedSubs.length > 0 ? (
                            associatedSubs.map((sub) => {
                              const isSubReady = ["A_RAMASSER", "PRET_A_EXPEDIER", "EXPEDIE", "DELIVERED"].includes(sub.status);
                              return (
                                <div key={sub.id} className="pt-1 flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-800">{sub.producerName || "Maraîcher"}</span>
                                  {isSubReady ? (
                                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                                      <CheckCircle2 size={12} /> Prêt en cagette (Lot: {sub.lotNumber || "HACCP"})
                                    </span>
                                  ) : (
                                    <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                                      <Clock size={12} /> En cours de récolte aux champs
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-slate-500 italic text-[11px]">En cours de traitement par les producteurs...</p>
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

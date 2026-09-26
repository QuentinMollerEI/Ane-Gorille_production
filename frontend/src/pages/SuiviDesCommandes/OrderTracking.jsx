import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase.js';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

import { OrderTimeline } from './components/OrderTimeline.jsx';
import { SubOrdersDetail } from './components/SubOrdersDetail.jsx';
import { ClaimsSection } from './components/ClaimsSection.jsx';

import { PackageCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function OrderTracking({ orderId, onBack }) {
  const { userProfile, user } = useAuth();
  const currentUser = userProfile || user || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          setError('Commande introuvable.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erreur chargement commande :', err);
        setError('Échec de la synchronisation de la commande.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const handleAddClaim = async (claimData) => {
    try {
      const claimsRef = collection(db, 'claims');
      await addDoc(claimsRef, {
        ...claimData,
        buyerUid: currentUser.uid || 'buyer_default',
        status: 'OPEN',
        createdAt: serverTimestamp()
      });
      alert('Votre réclamation a bien été prise en compte par le service support.');
    } catch (err) {
      console.error('Erreur soumission réclamation :', err);
      alert('Impossible de transmettre la réclamation.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-emerald-700" size={32} />
        <p className="text-xs font-bold text-slate-500">Chargement des données de suivi...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
        <AlertCircle size={32} className="text-rose-700 mx-auto" />
        <p className="text-xs font-bold text-rose-800">{error || 'Aucune commande sélectionnée.'}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            Retour
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-6 p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <PackageCheck className="text-emerald-700" size={24} />
            Suivi de Commande N° {order.masterOrderId || order.id}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Traçabilité Logistique &amp; Normes HACCP — Périmètre 50 km
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
      </div>

      <OrderTimeline status={order.status || 'PENDING'} timelineEvents={order.timeline || []} />

      <SubOrdersDetail subOrders={order.subOrders || []} />

      <ClaimsSection orderId={order.id} claims={order.claims || []} onSubmitClaim={handleAddClaim} />
    </div>
  );
}

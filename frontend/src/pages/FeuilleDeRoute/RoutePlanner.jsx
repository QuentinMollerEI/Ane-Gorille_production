import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase.js';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

import { RouteMap } from './components/RouteMap.jsx';
import { RouteStepsList } from './components/RouteStepsList.jsx';
import { PodSignatureModal } from './components/PodSignatureModal.jsx';

import { Navigation, Loader2, AlertCircle } from 'lucide-react';

export default function RoutePlanner() {
  const { userProfile, user } = useAuth();
  const currentUser = userProfile || user || {};

  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStepForPod, setSelectedStepForPod] = useState(null);
  const [selectedStepId, setSelectedStepId] = useState(null);

  useEffect(() => {
    if (!currentUser.uid) {
      setLoading(false);
      return;
    }

    const routesRef = collection(db, 'routes');
    const q = query(routesRef, where('driverUid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRoutes(list);
        if (list.length > 0) {
          setActiveRoute(list[0]);
        } else {
          setActiveRoute(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erreur chargement tournée :', err);
        setError('Impossible de synchroniser la feuille de route depuis le serveur.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleConfirmPod = async (stepId, podData) => {
    if (!activeRoute) return;

    const updatedSteps = (activeRoute.steps || []).map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'COMPLETED',
          pod: podData
        };
      }
      return step;
    });

    setActiveRoute((prev) => ({ ...prev, steps: updatedSteps }));
    setSelectedStepForPod(null);

    try {
      if (activeRoute.id) {
        const routeRef = doc(db, 'routes', activeRoute.id);
        await updateDoc(routeRef, { steps: updatedSteps });
      }
    } catch (err) {
      console.error('Erreur sauvegarde émargement POD :', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-emerald-700" size={32} />
        <p className="text-xs font-bold text-slate-500">Chargement de votre feuille de route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto my-6 p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Navigation className="text-emerald-700" size={24} />
            Feuille de Route &amp; Planificateur VUL
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Tournée de Ramasse &amp; Livraison
          </p>
        </div>

        {routes.length > 1 && (
          <select
            value={activeRoute?.id || ''}
            onChange={(e) => {
              const selected = routes.find((r) => r.id === e.target.value);
              if (selected) setActiveRoute(selected);
            }}
            className="px-3 py-1.5 bg-slate-100 font-mono font-bold text-xs text-slate-800 rounded-xl outline-none cursor-pointer"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeName || `Tournée #${r.id}`}
              </option>
            ))}
          </select>
        )}

        {activeRoute && routes.length <= 1 && (
          <span className="text-xs bg-slate-100 text-slate-800 font-mono font-bold px-3 py-1 rounded-full">
            {activeRoute.routeName || 'Tournée Active'}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeRoute ? (
        <div className="space-y-6">
          <RouteMap
            steps={activeRoute.steps || []}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            hubLocation={activeRoute.hubLocation}
          />

          <RouteStepsList
            steps={activeRoute.steps || []}
            selectedStepId={selectedStepId}
            onSelectStepForPod={(step) => setSelectedStepForPod(step)}
          />

          <PodSignatureModal
            step={selectedStepForPod}
            isOpen={!!selectedStepForPod}
            onClose={() => setSelectedStepForPod(null)}
            onConfirmPod={handleConfirmPod}
          />
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs font-bold bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
          <Navigation className="text-slate-300 mx-auto" size={32} />
          <p className="font-black text-slate-700 text-sm">Aucune feuille de route assignée</p>
          <p className="text-slate-500 font-medium">Vous n'avez aucune tournée de livraison planifiée pour le moment dans Firestore.</p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../../../config/firebase";
import SepaMandateModal from "../../../../components/payments/SepaMandateModal";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";

/**
 * 🔒 COMPOSANT : PaymentForm.jsx
 * Responsabilité : Gestion du mode de règlement B2B et ouverture de la modal SEPA
 */
export default function PaymentForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [mandateSuccess, setMandateSuccess] = useState(false);
  const [loadingSepa, setLoadingSepa] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Synchronisation du statut SEPA en temps réel
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sepaMandateActive || data.preferredPayment === "stripe_sepa") {
          setMandateSuccess(true);
        }
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Initialisation du SetupIntent SEPA
  const handleStartSepaSetup = async () => {
    if (!user?.uid || loadingSepa) return;
    setLoadingSepa(true);
    try {
      const functions = getFunctions(auth.app, "europe-west9");
      const createSetupIntent = httpsCallable(
        functions,
        "createSepaSetupIntentServer"
      );
      const res = await createSetupIntent({ userId: user.uid });
      if (res.data?.clientSecret) {
        setClientSecret(res.data.clientSecret);
      } else {
        alert("Impossible d'initialiser le mandat SEPA.");
      }
    } catch (error) {
      console.error("SEPA SETUP ERROR :", error);
      alert(error.message || "Erreur lors de l'accès au service bancaire.");
    } finally {
      setLoadingSepa(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-700" />
            <span>Moyen de Paiement Professionnel (B2B)</span>
          </h3>
          <p className="text-gray-500 font-medium mt-0.5">
            Votre mode de règlement certifié et conforme DSP2.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-xl font-bold bg-emerald-800 text-white text-xs">
            Prélèvement SEPA
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-600">
          <Lock size={18} className="text-emerald-700 shrink-0" />
          <p className="text-[11px] font-medium leading-relaxed">
            <strong className="text-gray-900">Sécurité PCI-DSS v4 : </strong>
            Saisie isolée sous iFrame certifiée Stripe. Aucun IBAN n'est stocké sur nos serveurs.
          </p>
        </div>

        <div>
          {mandateSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-extrabold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-700" />
                <span>Mandat SEPA configuré et actif pour votre compte.</span>
              </div>
              <button
                type="button"
                onClick={handleStartSepaSetup}
                disabled={loadingSepa}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl font-bold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingSepa ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Mettre à jour l'IBAN"
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl font-extrabold flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-900 text-xs">
                  Aucun Mandat SEPA actif
                </p>
                <p className="text-[11px] text-amber-700 font-medium">
                  Signez votre mandat pour débloquer le règlement différé B2B à 30 jours.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartSepaSetup}
                disabled={loadingSepa}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingSepa ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Configurer le Mandat SEPA</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Modal Stripe Elements */}
      {clientSecret && (
        <SepaMandateModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
          onSuccess={async () => {
            setClientSecret(null);
            setMandateSuccess(true);
            if (user?.uid) {
              await updateDoc(doc(db, "users", user.uid), {
                sepaMandateActive: true,
                preferredPayment: "stripe_sepa",
                updatedAt: new Date().toISOString(),
              });
            }
            if (onProfileUpdated) onProfileUpdated();
          }}
        />
      )}
    </div>
  );
}
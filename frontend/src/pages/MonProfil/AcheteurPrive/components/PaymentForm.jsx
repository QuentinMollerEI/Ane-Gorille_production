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
  Building,
  Lock,
} from "lucide-react";

/**
 * 🔒 COMPOSANT : PaymentForm.jsx
 * Responsabilité : Gestion du mode de règlement B2B et ouverture de la modal SEPA
 */
export default function PaymentForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stripe_sepa");
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
        "createSepaSetupIntentServer",
      );

      const res = await createSetupIntent({ userId: user.uid });

      if (res.data?.clientSecret) {
        setClientSecret(res.data.clientSecret);
      } else {
        alert("Impossible d'initialiser le mandat SEPA.");
      }
    } catch (error) {
      console.error("[SEPA SETUP ERROR] :", error);
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
            Moyen de Paiement Professionnel (B2B)
          </h3>
          <p className="text-gray-500 font-medium mt-0.5">
            Choisissez votre mode de règlement certifié et conforme DSP2.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("stripe_sepa")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === "stripe_sepa"
                ? "bg-emerald-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Prélèvement SEPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank_transfer")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === "bank_transfer"
                ? "bg-emerald-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Virement Bancaire
          </button>
        </div>
      </div>

      {activeTab === "stripe_sepa" && (
        <div className="space-y-4">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-600">
            <Lock size={18} className="text-emerald-700 shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">
              <strong className="text-gray-900">Sécurité PCI-DSS v4 : </strong>
              Saisie isolée sous iFrame certifiée Stripe. Aucun IBAN n'est
              stocké sur nos serveurs.
            </p>
          </div>

          {mandateSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-extrabold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-700" />
                <span>Mandat SEPA configuré et actif pour votre compte.</span>
              </div>
              <button
                type="button"
                onClick={handleStartSepaSetup}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Mettre à jour l'IBAN
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-950">
                  Aucun Mandat SEPA actif
                </p>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Signez votre mandat pour débloquer le règlement différé B2B à
                  30 jours.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartSepaSetup}
                disabled={loadingSepa}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:bg-gray-300"
              >
                {loadingSepa ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>Configurer le Mandat SEPA</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "bank_transfer" && (
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-blue-950 font-extrabold">
            <Building size={18} className="text-blue-700" />
            <span>
              Paiement par Virement Bancaire à Réception de Bon de Commande
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed font-medium">
            En choisissant ce mode, vos commandes généreront immédiatement un{" "}
            <strong>Bon de Commande officiel (BC)</strong>.
          </p>
        </div>
      )}

      {/* Pop-up Modal Stripe Elements */}
      {clientSecret && (
        <SepaMandateModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
          onSuccess={async () => {
            setClientSecret(null);
            setMandateSuccess(true);
            if (user?.uid) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                sepaMandateActive: true,
                preferredPayment: "stripe_sepa",
                updatedAt: new Date().toISOString(),
              });
              if (onProfileUpdated) onProfileUpdated();
            }
          }}
        />
      )}
    </div>
  );
}

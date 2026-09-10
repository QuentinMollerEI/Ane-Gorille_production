import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "../../../../config/firebase";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Sprout,
} from "lucide-react";

/**
 * 🔒 SOUS-COMPOSANT : StripeOnboardingForm.jsx
 * Emplacement : src/pages/MonProfil/Producteur/components/StripeOnboardingForm.jsx
 * Connexion à la Cloud Function v2 createStripeConnectAccountServer (europe-west9).
 */
export default function StripeOnboardingForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stripeStatus, setStripeStatus] = useState({
    stripeAccountId: "",
    stripeConnectCompleted: false,
  });

  // Client Firebase Functions configuré sur la région europe-west9 (Paris)
  const functions = getFunctions(auth?.app || db?.app, "europe-west9");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchStripeStatus() {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setStripeStatus({
            stripeAccountId: data.stripeAccountId || "",
            stripeConnectCompleted: Boolean(
              data.stripeConnectCompleted ||
              data.stripeOnboardingStatus === "COMPLETED",
            ),
          });
        }
      } catch (error) {
        console.error("Erreur chargement statut Stripe :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStripeStatus();
  }, [user?.uid]);

  const handleConnectStripe = async () => {
    if (!user?.uid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createStripeAccountCall = httpsCallable(
        functions,
        "createStripeConnectAccountServer",
      );

      const response = await createStripeAccountCall({ producerId: user.uid });
      const result = response.data;

      if (result && result.success && result.onboardingUrl) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          stripeAccountId: result.stripeAccountId,
          stripeOnboardingStatus: "PENDING",
          updatedAt: new Date().toISOString(),
        });

        setStripeStatus({
          stripeAccountId: result.stripeAccountId,
          stripeConnectCompleted: false,
        });

        if (onProfileUpdated) onProfileUpdated();

        // Ouverture sécurisée de la fenêtre Stripe Connect
        window.open(result.onboardingUrl, "_blank", "noopener,noreferrer");
      } else {
        setErrorMessage(
          result?.error ||
            "Échec de génération du lien d'authentification Stripe.",
        );
      }
    } catch (error) {
      console.error("[STRIPE CONNECT ERROR DETAILS] :", error);

      // Traitement des détails d'erreurs Firebase Functions
      if (error.code === "functions/internal") {
        setErrorMessage(
          "Erreur interne du serveur (500) : Vérifiez que la variable STRIPE_SECRET_KEY est configurée dans Firebase Functions et que la fonction est déployée sur europe-west9.",
        );
      } else if (error.code === "functions/not-found") {
        setErrorMessage(
          "La Cloud Function 'createStripeConnectAccountServer' est introuvable sur la région europe-west9.",
        );
      } else {
        setErrorMessage(
          error.message ||
            "Erreur de communication avec la Cloud Function Stripe.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <CreditCard size={16} className="text-emerald-700" />
          Compte de Versement Ventes Directes (Stripe Connect Express)
        </h3>
        {stripeStatus.stripeConnectCompleted && (
          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            <CheckCircle2 size={14} /> Compte Actif
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
            <Sprout size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-emerald-950 text-xs">
              Guichet Sécurisé Stripe Connect Express (Région europe-west9)
            </h4>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              La plateforme se connecte à Stripe pour vous rediriger vers
              l'interface officielle de vérification d'identité (KYC) et la
              saisie de votre RIB.
            </p>
          </div>
        </div>

        {stripeStatus.stripeAccountId && (
          <div className="bg-white p-3 rounded-xl border border-emerald-200/80 font-mono text-[11px] flex justify-between items-center">
            <span className="text-gray-500 font-semibold">Compte Stripe :</span>
            <span className="font-bold text-gray-900">
              {stripeStatus.stripeAccountId}
            </span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleConnectStripe}
            disabled={isSubmitting}
            className="px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connexion à Stripe Connect...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Ouvrir l'inscription Stripe Connect</span>
                <ExternalLink size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

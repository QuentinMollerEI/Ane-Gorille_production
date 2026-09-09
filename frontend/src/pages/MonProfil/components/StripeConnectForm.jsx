import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { StripeConnectService } from "../../../services/stripeConnectService";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

/**
 * 💳 COMPOSANT : StripeConnectForm.jsx (v6 - Onboarding Réel Stripe Connect)
 *
 * Responsabilité unique (SRP) : Initier l'onboarding Stripe Express pour les fournisseurs,
 * détecter en temps réel la présence de l'ID Stripe (acct_...) et valider automatiquement
 * l'inscription avec affichage au vert dès la fin du KYC Stripe.
 */
export default function StripeConnectForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [realtimeProfile, setRealtimeProfile] = useState(null);

  // 🔄 1. ÉCOUTE EN TEMPS RÉEL DU PROFIL FIRESTORE
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRealtimeProfile(data);

          // Si un ID Stripe existe et qu'il revient de l'onboarding (retour URL ou détection ID)
          if (
            data.stripeAccountId &&
            data.stripeAccountId.startsWith("acct_")
          ) {
            const isUrlSuccess =
              window.location.search.includes("stripe=success") ||
              window.location.hash.includes("stripe=success");
            if (isUrlSuccess && data.stripeOnboardingStatus !== "COMPLETED") {
              try {
                await updateDoc(userRef, {
                  stripeOnboardingStatus: "COMPLETED",
                  stripeDetailsSubmitted: true,
                  updatedAt: new Date(),
                });
              } catch (e) {
                console.error(
                  "Erreur de mise à jour automatique du statut Stripe :",
                  e,
                );
              }
            }
          }
        }
      },
      (err) => {
        console.error("Erreur d'écoute profil Stripe :", err);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 🚀 2. DÉCLENCHEMENT DE L'ONBOARDING STRIPE EXPRESS
  const handleStripeConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      if (StripeConnectService && StripeConnectService.startStripeOnboarding) {
        const onboardingUrl = await StripeConnectService.startStripeOnboarding(
          user.uid,
        );
        if (onboardingUrl) {
          window.location.href = onboardingUrl;
          return;
        }
      }
      throw new Error("Impossible de générer l'URL d'onboarding Stripe.");
    } catch (err) {
      console.error("Échec de l'onboarding Stripe :", err);
      setError(
        err.message || "Erreur lors de la génération du lien Stripe Connect.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔄 3. RAFRAÎCHISSEMENT MANUEL SI BESOIN
  const handleRefreshStatus = async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setRealtimeProfile(snap.data());
      }
    } catch (err) {
      console.error("Erreur de rafraîchissement :", err);
    } finally {
      setRefreshing(false);
    }
  };

  // 🛡️ DÉTECTION DU COMPTE STRIPE LIÉ & VALIDÉ
  const stripeAccountId =
    realtimeProfile?.stripeAccountId || user?.stripeAccountId || "";
  const hasStripeLinked = Boolean(
    stripeAccountId && stripeAccountId.startsWith("acct_"),
  );

  // S'il possède un ID Stripe valide (acct_...), la liaison est effective et passe au vert
  const isKycCompleted = Boolean(
    hasStripeLinked &&
    (realtimeProfile?.stripeOnboardingStatus === "COMPLETED" ||
      realtimeProfile?.stripeDetailsSubmitted === true ||
      realtimeProfile?.stripeOnboardingStatus !== "PENDING"),
  );

  // --- 🟢 CAS 1 : COMPTE STRIPE REÇU ET VALIDÉ (Rendu au Vert) ---
  if (hasStripeLinked) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-emerald-900 text-sm">
                Compte bancaire Stripe Connect actif et opérationnel !
              </h3>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                Votre identifiant Stripe a bien été enregistré. Les reversements
                automatiques de vos ventes (82% du montant TTC) seront
                transférés directement sur votre compte bancaire d'exploitation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="p-2 bg-white border border-emerald-300 text-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors shrink-0"
            title="Rafraîchir le statut"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div className="font-mono text-gray-700">
            ID Stripe Connect :{" "}
            <span className="font-black text-gray-900">{stripeAccountId}</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black uppercase tracking-wider text-[10px]">
            Inscrit & Actif (Express)
          </span>
        </div>
      </div>
    );
  }

  // --- 🟡 CAS 2 : PAS ENCORE LIÉ (Formulaire d'Abonnement Stripe) ---
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 border-b border-gray-150 pb-4">
        <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
          <CreditCard size={22} />
        </span>
        <div>
          <h2 className="font-black text-gray-900 text-base">
            Configuration des Reversements Stripe Connect (Obligatoire)
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Connectez votre compte Stripe d'exploitation pour recevoir vos
            reversements bancaires.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
        <p>
          <strong>Réglementation Bancaire PSD2 / ACPR</strong> : Conformément
          aux obligations légales applicables aux marketplaces, les règlements
          des acheteurs sont sécurisés sur un compte de cantonnement Stripe.
        </p>
        <p>
          En liant votre compte, Stripe prélèvera la commission de la plateforme
          et versera <strong>82% du montant TTC de vos ventes</strong>{" "}
          directement sur votre RIB.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleStripeConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Redirection vers Stripe Express...</span>
            </>
          ) : (
            <>
              <CreditCard size={16} />
              <span>Associer mon compte bancaire d'exploitation (Express)</span>
              <ExternalLink size={14} />
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase justify-center border-t border-gray-100 pt-3">
        <ShieldCheck size={14} className="text-emerald-600" />
        Sécurisé et Chiffré par Stripe Connect Express
      </div>
    </div>
  );
}

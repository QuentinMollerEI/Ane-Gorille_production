import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext"; // Ajustez le chemin selon votre arborescence
import { StripeConnectService } from "../../../../services/stripeConnectService"; // Import du vrai service [cite: 55]
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../services/firestore.service"; // Liaison à la base active
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function StripeConnectForm() {
  const { user } = useAuth(); // Récupère le maraîcher connecté
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realtimeProfile, setRealtimeProfile] = useState(null);

  // 🔄 ÉCOUTE EN TEMPS RÉEL : On surveille le statut Stripe du maraîcher dans Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRealtimeProfile(docSnap.data());
        }
      },
      (err) => {
        console.error("Erreur écoute profil :", err);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleStripeConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1️⃣ Appel de notre API à Paris (europe-west9) pour créer le compte Express [cite: 55]
      const onboardingUrl = await StripeConnectService.startStripeOnboarding(
        user.uid,
      );

      // 2️⃣ Redirection du maraîcher vers le portail sécurisé de Stripe pour son KYC [cite: 55]
      window.location.href = onboardingUrl;
    } catch (err) {
      console.error("Échec de l'onboarding Stripe :", err);
      setError(
        err.message || "Impossible de générer le lien de connexion Stripe.",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasStripeLinked = !!realtimeProfile?.stripeAccountId;
  const isKycCompleted =
    realtimeProfile?.stripeOnboardingStatus === "COMPLETED";

  // --- RENDU CAS 1 : LE COMPTE EST ENTIÈREMENT CONNECTÉ & VALIDÉ ---
  if (hasStripeLinked && isKycCompleted) {
    return (
      <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-900 text-sm">
              Compte bancaire lié et opérationnel !
            </h3>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              Votre établissement **{realtimeProfile?.companyName || "agricole"}
              ** est correctement configuré. Les reversements de vos ventes (82%
              du montant TTC) seront transférés automatiquement sur votre compte
              bancaire [cite: 54, 55].
            </p>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/60 rounded-xl p-4 flex justify-between items-center text-xs">
          <div className="font-mono text-gray-500">
            ID Stripe Connect :{" "}
            <span className="font-bold text-gray-800">
              {realtimeProfile.stripeAccountId}
            </span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]">
            Actif (Express)
          </span>
        </div>
      </div>
    );
  }

  // --- RENDU CAS 2 : ID EXISTE MAIS KYC EN ATTENTE (Redirection nécessaire) ---
  if (hasStripeLinked && !isKycCompleted) {
    return (
      <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-950 text-sm">
              Action Requise : Finaliser votre dossier
            </h3>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Votre identifiant Stripe a été créé, mais vous devez remplir vos
              informations d'identité (KYC) et votre RIB sur l'espace Stripe
              pour pouvoir activer vos reversements automatiques [cite: 55].
            </p>
          </div>
        </div>

        <button
          onClick={handleStripeConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              Reprendre la configuration Stripe <ExternalLink size={14} />
            </>
          )}
        </button>
      </div>
    );
  }

  // --- RENDU CAS 3 : SANS LIAISON (Formulaire d'onboarding vierge) ---
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="p-2 bg-red-50 text-red-700 rounded-xl">
          <CreditCard size={20} />
        </span>
        <h2 className="font-black text-gray-800 text-base">
          Configuration des versements Stripe Connect
        </h2>
      </div>

      <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed">
        <p>
          <strong>Loi PSD2 / ACPR (Réglementation Bancaire)</strong> : Afin de
          garantir la conformité de notre coopérative en circuit court, les
          fonds issus des acheteurs ne transitent jamais sur le compte de notre
          plateforme. Ils sont sécurisés sur un compte de cantonnement Stripe
          [cite: 54].
        </p>
        <p>
          En liant votre compte, Stripe Connect se chargera de prélever notre
          commission de 18% et de déposer automatiquement vos{" "}
          <strong>82% de revenus</strong> directement sur votre RIB [cite: 54,
          55].
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleStripeConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Génération de l'espace Stripe...
            </>
          ) : (
            <>
              <CreditCard size={14} />
              Associer mon compte bancaire (Express)
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase justify-center border-t border-gray-100 pt-4">
        <ShieldCheck size={14} className="text-emerald-600" />
        Sécurisé et Chiffré par Stripe Connect
      </div>
    </div>
  );
}

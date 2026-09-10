import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { StripeConnectService } from "../../../services/stripeConnectService";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function StripeConnectForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStripeConnect = async () => {
    if (!user?.uid) {
      setError("Vous devez être connecté pour lier votre compte Stripe.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Appel du service et récupération directe de l'URL d'onboarding
      const onboardingUrl = await StripeConnectService.startStripeOnboarding(
        user.uid,
      );
      if (onboardingUrl) {
        window.location.href = onboardingUrl;
      }
    } catch (err) {
      console.error("Échec de l'onboarding Stripe :", err);
      setError(err.message || "Erreur lors de la connexion au serveur Stripe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <CreditCard className="text-emerald-700 shrink-0" size={22} />
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Compte de Reversement Stripe Connect
          </h3>
          <p className="text-gray-500">
            Recevez vos ventes en direct sur votre compte bancaire (Séquestre
            PSP conforme ACPR).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {user?.stripeAccountId ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              Compte Stripe actif :{" "}
              <span className="font-mono text-emerald-800">
                {user.stripeAccountId}
              </span>
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-1 rounded-md">
            CONFIGURÉ
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStripeConnect}
          disabled={loading}
          className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Génération du lien sécurisé Stripe...</span>
            </>
          ) : (
            <>
              <ExternalLink size={16} />
              <span>Lier mon compte d'exploitation à Stripe Connect</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

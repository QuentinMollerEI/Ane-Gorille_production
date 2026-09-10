import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { profileService } from "../../../../services/profile.service";
import { paymentService } from "../../../../services/paymentService";
import {
  Building2,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  CreditCard,
} from "lucide-react";

/**
 * 🔒 COMPOSANT : BillieForm.jsx
 * Responsabilité unique : Configuration des conditions de paiement B2B (prélèvement à 30 jours)
 * et initialisation sécurisée du Mandat SEPA via l'interface abstraite de paiement (Pattern Strategy).
 * Conforme PCI-DSS & RGPD (Zéro stockage d'IBAN brut dans Firestore).
 */
export default function BillieForm() {
  const { user } = useAuth();

  // États de configuration B2B
  const [deferredPaymentEnabled, setDeferredPaymentEnabled] = useState(true);
  const [sepaStatus, setSepaStatus] = useState("unconfigured"); // "unconfigured" | "active" | "pending"
  const [last4, setLast4] = useState(null);

  // États de chargement et retours d'interface
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loadingMandateSession, setLoadingMandateSession] = useState(false);
  const [message, setMessage] = useState(null);

  // 1. Chargement du profil B2B
  useEffect(() => {
    if (!user?.uid) return;

    async function loadB2BProfile() {
      try {
        setLoading(true);
        const profile = await profileService.getUserProfile(user.uid);
        if (profile) {
          setDeferredPaymentEnabled(profile.deferredPaymentEnabled ?? true);
          setSepaStatus(profile.sepaMandateStatus || "unconfigured");
          setLast4(profile.bankDetailsSummary?.last4 || null);
        }
      } catch (err) {
        console.error("Erreur chargement profil B2B :", err);
        setMessage({
          type: "error",
          text: "Impossible de charger vos préférences B2B.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadB2BProfile();
  }, [user?.uid]);

  // 2. Sauvegarde des préférences de paiement à 30 jours
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSavingPreferences(true);
    setMessage(null);

    try {
      await profileService.updateUserProfile(
        user.uid,
        { deferredPaymentEnabled },
        user.role,
      );
      setMessage({
        type: "success",
        text: "Préférences de paiement B2B enregistrées avec succès !",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error("Erreur sauvegarde préférences B2B :", err);
      setMessage({
        type: "error",
        text: "Erreur lors de la mise à jour des préférences.",
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  // 3. Configuration du Mandat SEPA via paymentService (Pattern Strategy)
  const handleSetupSepaMandate = async () => {
    if (!user?.uid) return;

    setLoadingMandateSession(true);
    setMessage(null);

    try {
      const session = await paymentService.setupB2BMandate(user.uid);

      if (session.provider === "stripe_sepa") {
        setMessage({
          type: "success",
          text: "Session SEPA initialisée avec succès. Vous pouvez finaliser l'enregistrement de votre mandat.",
        });
      } else if (session.provider === "billie" && session.redirectUrl) {
        window.location.href = session.redirectUrl;
      }
    } catch (err) {
      console.error("Erreur initialisation Mandat SEPA :", err);
      setMessage({
        type: "error",
        text: err.message || "Échec de l'initialisation du mandat SEPA.",
      });
    } finally {
      setLoadingMandateSession(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-3xl text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-emerald-700" />
        <span>Chargement des paramètres B2B & SEPA...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
      {/* EN-TÊTE DU MODULE B2B */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <Building2 className="text-emerald-700 shrink-0" size={20} />
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">
              Conditions de Paiement B2B & Mandat SEPA
            </h3>
            <p className="text-gray-500 font-medium mt-0.5">
              Règlement à 30 jours par prélèvement automatique certifié.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-extrabold text-[10px] uppercase rounded-full border border-blue-200 shrink-0">
          Option B2B Active
        </span>
      </div>

      {/* MESSAGE D'ALERTE / SUCCÈS */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl font-bold flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* AVIS DE CONFORMITÉ FINANCIÈRE */}
      <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-600">
        <Lock size={18} className="text-emerald-700 shrink-0" />
        <p className="text-[11px] font-medium leading-relaxed">
          <strong className="text-gray-900">
            Sécurité Financière (PCI-DSS & RGPD) :
          </strong>{" "}
          Vos coordonnées bancaires brutes ne sont jamais enregistrées sur nos
          serveurs. L'empreinte du mandat est gérée sous coffre-fort chiffré
          certifié.
        </p>
      </div>

      {/* STATUT ET CONFIGURATION DU MANDAT SEPA */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-emerald-950">
            Statut du Mandat de Prélèvement SEPA B2B :
          </span>
          {sepaStatus === "active" ? (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase rounded-lg border border-emerald-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={13} className="text-emerald-700" />
              Mandat Actif (•••• {last4 || "0123"})
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-[10px] uppercase rounded-lg border border-amber-300 shrink-0">
              Non Configuré
            </span>
          )}
        </div>

        {sepaStatus !== "active" && (
          <button
            type="button"
            onClick={handleSetupSepaMandate}
            disabled={loadingMandateSession}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1"
          >
            {loadingMandateSession ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Connexion au coffre-fort bancaire...</span>
              </>
            ) : (
              <>
                <CreditCard size={15} />
                <span>
                  Configurer le Mandat SEPA B2B (Coffre-Fort Sécurisé)
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* FORMULAIRE DES PRÉFÉRENCES DE PAIEMENT DIFFÉRÉ */}
      <form
        onSubmit={handleSavePreferences}
        className="space-y-4 pt-1 border-t border-gray-100"
      >
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-gray-800">
            Activer le règlement différé à 30 jours sur vos commandes :
          </span>
          <input
            type="checkbox"
            checked={deferredPaymentEnabled}
            onChange={(e) => setDeferredPaymentEnabled(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={savingPreferences}
          className="w-full py-3 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {savingPreferences ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShieldCheck size={15} />
          )}
          <span>
            {savingPreferences
              ? "Enregistrement..."
              : "Sauvegarder mes Préférences B2B"}
          </span>
        </button>
      </form>
    </div>
  );
}

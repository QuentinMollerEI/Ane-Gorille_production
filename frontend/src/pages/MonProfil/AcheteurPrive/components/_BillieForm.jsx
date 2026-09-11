import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { profileService } from "../../../../services/profile.service";
import * as paymentService from "../../../../services/paymentService";
import SepaMandateModal from "../../../../components/payments/SepaMandateModal";
import {
  Building2,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  CreditCard,
  Landmark,
} from "lucide-react";

export default function BillieForm() {
  const { user } = useAuth();
  const [deferredPaymentEnabled, setDeferredPaymentEnabled] = useState(true);
  const [sepaStatus, setSepaStatus] = useState("unconfigured");
  const [last4, setLast4] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loadingMandateSession, setLoadingMandateSession] = useState(false);
  const [message, setMessage] = useState(null);

  // Contrôle exclusif de l'ouverture du pop-up Stripe
  const [clientSecret, setClientSecret] = useState(null);

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
        console.error("Erreur profil B2B :", err);
      } finally {
        setLoading(false);
      }
    }
    loadB2BProfile();
  }, [user?.uid]);

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
        text: "Préférences commerciales enregistrées.",
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSetupSepaMandate = async () => {
    if (!user?.uid) return;
    setLoadingMandateSession(true);
    setMessage(null);
    try {
      const result = await paymentService.initSepaSetupIntent();
      if (result && result.clientSecret) {
        // Déclenche l'iFrame sécurisée, supprime tout message de succès prématuré
        setClientSecret(result.clientSecret);
      } else {
        throw new Error("Impossible de générer le jeton de sécurité Stripe.");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Échec de connexion au serveur bancaire.",
      });
    } finally {
      setLoadingMandateSession(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-3xl text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-emerald-700" />
        <span>Synchronisation de vos données financières...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <Landmark className="text-emerald-700 shrink-0" size={20} />
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">
              Règlement B2B & Mandat SEPA Interentreprises
            </h3>
            <p className="text-gray-500 font-medium mt-0.5">
              Activez le prélèvement à 30 jours via notre partenaire bancaire
              agréé.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-extrabold text-[10px] uppercase rounded-full border border-blue-200 shrink-0">
          Compte Pro
        </span>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl font-bold flex items-center gap-2 border ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Avertissement Légal Renforcé (DSP2 / ACPR) */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-gray-600">
        <Lock size={18} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-gray-900 block text-xs">
            Coffre-fort électronique certifié PCI-DSS
          </strong>
          <p className="text-[11px] font-medium leading-relaxed">
            Conformément à la directive européenne DSP2, vos données bancaires
            sont cryptées et gérées exclusivement par notre Prestataire de
            Services de Paiement (PSP) agréé par l'ACPR[cite: 9, 15]. La
            plateforme ne stocke aucune coordonnée brute sur ses serveurs.
          </p>
        </div>
      </div>

      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-emerald-950">
            Statut de l'autorisation de prélèvement :
          </span>
          {sepaStatus === "active" ? (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase rounded-lg border border-emerald-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={13} className="text-emerald-700" />
              Mandat Actif (•••• {last4 || "0123"})
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-[10px] uppercase rounded-lg border border-amber-300 shrink-0">
              En attente de signature
            </span>
          )}
        </div>

        {sepaStatus !== "active" && (
          <button
            type="button"
            onClick={handleSetupSepaMandate}
            disabled={loadingMandateSession}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loadingMandateSession ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Création du tunnel sécurisé...</span>
              </>
            ) : (
              <>
                <CreditCard size={15} />
                <span>Renseigner mon IBAN (Popup Sécurisé Stripe)</span>
              </>
            )}
          </button>
        )}
      </div>

      <form
        onSubmit={handleSavePreferences}
        className="space-y-4 pt-1 border-t border-gray-100"
      >
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
          <span className="font-bold text-gray-800">
            Autoriser le règlement différé (30 jours) sur mes factures :
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
              ? "Application en cours..."
              : "Valider mes préférences"}
          </span>
        </button>
      </form>

      {/* Fenêtre modale gérée de manière isolée */}
      {clientSecret && (
        <SepaMandateModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
          onSuccess={() => {
            setClientSecret(null);
            setSepaStatus("active");
            setMessage({
              type: "success",
              text: "Votre mandat de prélèvement SEPA a été signé et activé avec succès.",
            });
          }}
        />
      )}
    </div>
  );
}

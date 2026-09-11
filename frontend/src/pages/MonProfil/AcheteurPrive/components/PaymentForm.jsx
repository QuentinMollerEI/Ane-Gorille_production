import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import * as paymentService from "../../../../services/paymentService";
import SepaMandateModal from "../../../../components/payments/SepaMandateModal";
import {
  Building,
  Lock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export default function PaymentForm({ onProfileUpdated }) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("stripe_sepa");
  const [deferredPaymentEnabled, setDeferredPaymentEnabled] = useState(true);
  const [sepaStatus, setSepaStatus] = useState("unconfigured");

  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loadingMandateSession, setLoadingMandateSession] = useState(false);

  const [clientSecret, setClientSecret] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    async function loadPaymentProfile() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setActiveTab(
            data.preferredPayment === "bank_transfer"
              ? "bank_transfer"
              : "stripe_sepa",
          );
          setDeferredPaymentEnabled(data.deferredPaymentEnabled ?? true);
          setSepaStatus(data.sepaMandateActive ? "active" : "unconfigured");
        }
      } catch (err) {
        console.error("Erreur de chargement :", err);
      } finally {
        setLoading(false);
      }
    }
    loadPaymentProfile();
  }, [user?.uid]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPreferences(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        preferredPayment: activeTab,
        deferredPaymentEnabled: deferredPaymentEnabled,
        updatedAt: new Date().toISOString(),
      });
      setMessage({
        type: "success",
        text: "Préférences commerciales enregistrées.",
      });
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSetupSepaMandate = async () => {
    setLoadingMandateSession(true);
    try {
      const result = await paymentService.initSepaSetupIntent();
      if (result && result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        throw new Error("Impossible de générer le jeton Stripe.");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Échec de connexion au PSP.",
      });
    } finally {
      setLoadingMandateSession(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Moyen de Paiement Professionnel
          </h3>
          <p className="text-gray-500 font-medium mt-0.5">
            Choisissez votre mode de règlement B2B/B2G.
          </p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("stripe_sepa")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${activeTab === "stripe_sepa" ? "bg-white text-emerald-800 shadow-sm border border-gray-200" : "text-gray-500"}`}
          >
            Prélèvement SEPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank_transfer")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${activeTab === "bank_transfer" ? "bg-white text-emerald-800 shadow-sm border border-gray-200" : "text-gray-500"}`}
          >
            Virement Bancaire
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl font-bold text-[11px] ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {activeTab === "stripe_sepa" && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-gray-600">
            <Lock size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-gray-900 block text-xs">
                Coffre-fort électronique certifié PCI-DSS
              </strong>
              <p className="text-[11px] font-medium leading-relaxed">
                Conformément à la directive européenne DSP2, vos données
                bancaires sont cryptées et gérées exclusivement par notre
                Prestataire de Services de Paiement (PSP) agréé par l'ACPR. La
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
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase rounded-lg flex items-center gap-1">
                  <CheckCircle2 size={13} /> Mandat Actif
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-[10px] uppercase rounded-lg">
                  En attente de signature
                </span>
              )}
            </div>

            {sepaStatus !== "active" && (
              <button
                type="button"
                onClick={handleSetupSepaMandate}
                disabled={loadingMandateSession}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl uppercase flex items-center justify-center gap-2 transition-all disabled:bg-gray-300"
              >
                {loadingMandateSession ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CreditCard size={15} />
                )}
                <span>Renseigner mon IBAN (Popup Sécurisé Stripe)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "bank_transfer" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-blue-950 font-extrabold">
            <Building size={16} className="text-blue-700" />
            <span>
              Paiement par Virement Bancaire à Réception de Bon de Commande
            </span>
          </div>
          <p className="text-gray-600 font-medium">
            Vos commandes généreront immédiatement un{" "}
            <strong>Bon de Commande officiel</strong>. Les marchandises seront
            expédiées à réception des fonds sur le compte séquestre.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSavePreferences}
        className="space-y-4 pt-3 border-t border-gray-100"
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
          className="w-full py-3 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-black rounded-xl uppercase flex items-center justify-center gap-2"
        >
          {savingPreferences ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShieldCheck size={15} />
          )}
          <span>Valider mes préférences</span>
        </button>
      </form>

      {/* Pop-up isolé */}
      {clientSecret && (
        <SepaMandateModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
          onSuccess={async () => {
            setClientSecret(null);
            setSepaStatus("active");
            await updateDoc(doc(db, "users", user.uid), {
              sepaMandateActive: true,
            });
            setMessage({
              type: "success",
              text: "Mandat SEPA activé avec succès.",
            });
            if (onProfileUpdated) onProfileUpdated();
          }}
        />
      )}
    </div>
  );
}

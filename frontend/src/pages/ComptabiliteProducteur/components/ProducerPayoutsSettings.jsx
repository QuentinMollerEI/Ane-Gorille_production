import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  CreditCard,
  Settings,
  ShieldCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function ProducerPayoutsSettings() {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [settings, setSettings] = useState({
    tvaRegime: "franchise", // 'franchise' (0%) | 'assujetti' (5.5%, 20%)
    stripeConnectId: "",
    payoutFrequency: "manual", // 'manual' | 'daily' | 'weekly'
    kycStatus: "pending", // 'pending' | 'verified'
  });

  // Charger les informations réelles depuis Firestore au montage du composant
  useEffect(() => {
    if (!user?.uid) return;

    async function loadProducerSettings() {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setSettings({
            tvaRegime: data.tvaRegime || "franchise",
            stripeConnectId: data.stripeConnectId || "acct_1N_test_connect",
            payoutFrequency: data.payoutFrequency || "manual",
            kycStatus: data.kycStatus || "verified",
          });
        }
      } catch (error) {
        console.error("Erreur de lecture des paramètres producteur :", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducerSettings();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        tvaRegime: settings.tvaRegime,
        stripeConnectId: settings.stripeConnectId,
        payoutFrequency: settings.payoutFrequency,
        kycStatus: settings.kycStatus,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (error) {
      console.error("Erreur de mise à jour des paramètres producteur :", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
        Chargement des paramètres de paiement...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Settings size={18} className="text-emerald-600" />
          3. Séquestre Stripe Connect & Paramètres Fiscaux (TVA)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-fade-in">
          {isSaved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-semibold flex items-center gap-2 animate-fade-in">
              <ShieldCheck size={16} /> Vos paramètres fiscaux et de paiement
              ont été enregistrés avec succès.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stripe Connect Info */}
            <div className="border border-gray-150 rounded-xl p-5 bg-gray-50/30">
              <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3">
                <CreditCard size={16} className="mr-2 text-emerald-600" />
                Compte de reversement (Stripe Connect)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Vos ventes sont séquestrées de manière sécurisée auprès de notre
                Prestataire de Services de Paiement (PSP) régulé ACPR.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    ID de Compte Express
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-gray-100 border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-600"
                    value={settings.stripeConnectId}
                  />
                </div>

                <div
                  className={`p-3 rounded-lg flex justify-between items-center ${settings.kycStatus === "verified" ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}
                >
                  <div>
                    <p className="text-xs font-bold">
                      Identité KYC de l'exploitation
                    </p>
                    <p className="text-[10px]">
                      {settings.kycStatus === "verified"
                        ? "Vérifiée par Stripe • Versements activés"
                        : "En cours de validation par l'administrateur"}
                    </p>
                  </div>
                  <span className="font-extrabold text-sm">
                    {settings.kycStatus === "verified" ? "✓" : "!"}
                  </span>
                </div>
              </div>
            </div>

            {/* Régime de TVA */}
            <div className="border border-gray-150 rounded-xl p-5 bg-gray-50/30 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center mb-3">
                  <Settings size={16} className="mr-2 text-emerald-600" />
                  Régime de TVA Légale
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Configurez votre régime de taxe pour l'édition légale et
                  automatique de vos factures de circuit court.
                </p>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="tvaRegime"
                      checked={settings.tvaRegime === "assujetti"}
                      onChange={() =>
                        setSettings({ ...settings, tvaRegime: "assujetti" })
                      }
                      className="mt-1 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        Assujetti à la TVA (5.5%, 20%)
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Pour les exploitations d'envergure, agricoles ou
                        coopératives.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="tvaRegime"
                      checked={settings.tvaRegime === "franchise"}
                      onChange={() =>
                        setSettings({ ...settings, tvaRegime: "franchise" })
                      }
                      className="mt-1 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        Franchise de TVA (Art. 293 B du CGI)
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Généralement applicable pour les micro-entrepreneurs.
                        Exonéré de TVA sur les ventes.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting
                ? "Sauvegarde..."
                : "Enregistrer mes paramètres fiscaux"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

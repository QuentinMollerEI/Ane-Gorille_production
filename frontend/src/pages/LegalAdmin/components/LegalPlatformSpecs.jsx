import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  ShieldCheck,
  Edit2,
  ChevronUp,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";

export default function LegalPlatformSpecs({ config }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState(
    config?.commissionRate || 18,
  );
  const [showSuccess, setShowSaved] = useState(false);

  const handleSaveCommission = async () => {
    setIsSaving(true);
    try {
      const configDocRef = doc(db, "config", "regulatory");
      await updateDoc(configDocRef, {
        commissionRate: Number(commissionRate),
        lastUpdated: new Date().toISOString(),
      });
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 4000);
    } catch (error) {
      console.error("Erreur d'enregistrement de la commission :", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <span className="p-1.5 bg-red-50 text-red-700 rounded-lg">✓</span>
          1. Intermédiation, Mandat de Facturation & Stripe Connect (PSD2)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-6 space-y-6 animate-fade-in">
          {showSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <ShieldCheck size={16} /> Taux de commission enregistré avec
              succès dans Firestore.
            </div>
          )}

          {/* Section d'affichage légal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4 text-sm text-gray-600">
              <p>
                <strong>Mandat de Facturation (Art. 289 du CGI)</strong> : Votre
                micro-entreprise n'étant pas propriétaire des stocks agricoles
                mis en ligne, vous facturez vos clients{" "}
                <strong>"au nom et pour le compte"</strong> de vos maraîchers
                tiers [cite: 14]. Les factures d'achats générées par le système
                portent la mention légale obligatoire :{" "}
                <em>
                  "Facture émise par [Âne & Gorille] au nom et pour le compte de
                  [Maraîcher]"
                </em>{" "}
                [cite: 14].
              </p>
              <p>
                <strong>Réglementation Bancaire (ACPR / PSD2)</strong> : Il est
                formellement interdit d'encaisser directement les fonds des
                acheteurs sur votre propre compte bancaire d'auto-entrepreneur
                pour les reverser ensuite aux maraîchers (ce qui constituerait
                un service de paiement illégal sans agrément) [cite: 14].
                L'argent est sécurisé sur un compte de cantonnement via{" "}
                <strong>Stripe Connect Express</strong>, puis Stripe reverse
                automatiquement 18% sur votre compte et 82% au maraîcher [cite:
                14].
              </p>
            </div>

            {/* Ajusteur de Commission dynamique */}
            <div className="bg-red-50/20 p-5 rounded-xl border border-red-100 flex flex-col justify-between items-center text-center">
              <div>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                  Commission Plateforme
                </p>
                {isEditing ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <input
                      type="number"
                      className="w-20 text-center font-black text-2xl text-red-950 border border-red-300 rounded-lg p-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                    />
                    <span className="text-2xl font-black text-red-950">%</span>
                  </div>
                ) : (
                  <p className="text-4xl font-black text-red-950 mt-1">
                    {config?.commissionRate || 18} %
                  </p>
                )}
                <p className="text-[10px] text-red-600 font-semibold uppercase mt-2">
                  Appliquée sur chaque vente
                </p>
              </div>

              {user?.role === "admin" && (
                <div className="mt-4 w-full">
                  {isEditing ? (
                    <button
                      onClick={handleSaveCommission}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Sauvegarder
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center justify-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-800 font-bold py-2 px-4 rounded-lg text-xs transition"
                    >
                      <Edit2 size={12} />
                      Modifier le taux
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

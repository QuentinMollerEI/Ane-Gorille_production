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

export default function FiscalVatLexicon({ config }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSaved] = useState(false);

  const [thresholds, setThresholds] = useState({
    tvaBaseThreshold: config?.tvaBaseThreshold || 37500,
    tvaMajoratedThreshold: config?.tvaMajoratedThreshold || 41250,
  });

  const handleSaveThresholds = async () => {
    setIsSaving(true);
    try {
      const configDocRef = doc(db, "config", "regulatory");
      await updateDoc(configDocRef, {
        tvaBaseThreshold: Number(thresholds.tvaBaseThreshold),
        tvaMajoratedThreshold: Number(thresholds.tvaMajoratedThreshold),
        lastUpdated: new Date().toISOString(),
      });
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 4000);
    } catch (error) {
      console.error("Erreur de sauvegarde des seuils TVA :", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <span className="p-1.5 bg-green-50 text-green-700 rounded-lg">✓</span>
          2. Statut Fiscal, Franchise de TVA & Déclaration Réelle URSSAF (Art.
          293 B)
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
              <ShieldCheck size={16} /> Seuils de Franchise de TVA mis à jour
              dans Firestore.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4 text-sm text-gray-600">
              <p>
                <strong>Franchise en Base de TVA (Art. 293 B du CGI)</strong> :
                Votre micro-entreprise est exonérée de déclaration et de
                paiement de la TVA sur vos services [cite: 14]. Vos factures de
                frais de service de 18% doivent comporter la mention légale
                obligatoire :{" "}
                <em>"TVA non applicable, article 293 B du CGI"</em> [cite: 4,
                14].
              </p>
              <p className="bg-red-50/30 p-3 rounded-lg border border-red-100 text-xs text-red-950 font-medium">
                ⚠️ <strong>Avertissement URSSAF critique</strong> : Vous ne
                devez déclarer à l'URSSAF{" "}
                <strong>que le montant brut de vos commissions de 18%</strong>{" "}
                (et vos frais de livraison s'ils vous reviennent), et surtout
                pas le montant total brut de la transaction du client [cite:
                14]. Si l'argent transite par votre compte courant
                d'auto-entrepreneur au lieu de Stripe Connect, vous seriez
                imposé à tort sur l'intégralité du chiffre d'affaires agricole
                et dépasseriez le plafond annuel légal (83 600 € HT) en quelques
                transactions [cite: 14] !
              </p>
            </div>

            {/* Fiche de surveillance des plafonds fiscaux */}
            <div className="bg-green-50/20 p-5 rounded-xl border border-green-100 flex flex-col justify-between text-xs space-y-3">
              <div>
                <p className="font-extrabold text-green-900 mb-2 uppercase tracking-wide">
                  Plafonds de Franchise TVA (2026)
                </p>

                <div className="space-y-2 font-medium text-gray-700">
                  <div className="flex justify-between border-b border-green-100 pb-1">
                    <span>Seuil de base :</span>
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 text-right font-bold border border-green-300 rounded px-1"
                        value={thresholds.tvaBaseThreshold}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            tvaBaseThreshold: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {config?.tvaBaseThreshold || 37500} € HT
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-green-100 pb-1">
                    <span>Seuil majoré :</span>
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-20 text-right font-bold border border-green-300 rounded px-1"
                        value={thresholds.tvaMajoratedThreshold}
                        onChange={(e) =>
                          setThresholds({
                            ...thresholds,
                            tvaMajoratedThreshold: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {config?.tvaMajoratedThreshold || 41250} € HT
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Plafond prestation :</span>
                    <span className="font-bold text-gray-900">83 600 € HT</span>
                  </div>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="pt-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveThresholds}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-1 bg-green-700 hover:bg-green-800 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase transition shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      Enregistrer
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center justify-center gap-1 bg-white border border-green-200 hover:bg-green-50 text-green-800 font-bold py-1.5 px-3 rounded text-[10px] uppercase transition"
                    >
                      <Edit2 size={10} />
                      Ajuster les seuils
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

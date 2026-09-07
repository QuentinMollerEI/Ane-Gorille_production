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

export default function B2gChorusEgalim({ config }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSaved] = useState(false);
  const [egalimQuota, setEgalimQuota] = useState(config?.egalimBioQuota || 20);

  const handleSaveQuota = async () => {
    setIsSaving(true);
    try {
      const configDocRef = doc(db, "config", "regulatory");
      await updateDoc(configDocRef, {
        egalimBioQuota: Number(egalimQuota),
        lastUpdated: new Date().toISOString(),
      });
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 4000);
    } catch (error) {
      console.error("Erreur d'enregistrement EGAlim :", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <span className="p-1.5 bg-green-50 text-green-700 rounded-lg">✓</span>
          4. Facturation Publique (Chorus Pro B2G) & Objectif Loi EGAlim
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
              <ShieldCheck size={16} /> Objectif légal EGAlim mis à jour dans
              Firestore.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4 text-sm text-gray-600">
              <p>
                <strong>Dépôt Obligatoire Chorus Pro</strong> : Dès le premier
                euro facturé à une cantine scolaire, un hôpital public ou une
                collectivité (B2G), l'opérateur de la plateforme a l'obligation
                légale de télétransmettre la facture sur le portail d'État{" "}
                <strong>Chorus Pro</strong> [cite: 5, 83]. Le système exige le
                format de facture hybride standardisé <strong>Factur-X</strong>{" "}
                [cite: 5, 92].
              </p>
              <p>
                <strong>Données obligatoires de routage public</strong> : Pour
                éviter tout rejet de règlement de mandat administratif public,
                le profil d'achat de la collectivité doit obligatoirement être
                renseigné avec : le numéro de <strong>SIRET</strong> de
                l'établissement public, le <strong>Code Service</strong>{" "}
                comptable destinataire et le numéro de{" "}
                <strong>référence d'engagement</strong> (le bon de commande
                public initial) [cite: 5, 62, 91].
              </p>
            </div>

            {/* Quota légal EGAlim paramétrable */}
            <div className="bg-emerald-50/20 p-5 rounded-xl border border-emerald-100 flex flex-col justify-between text-xs space-y-3">
              <div>
                <p className="font-extrabold text-emerald-900 mb-2 uppercase tracking-wide">
                  Objectif d'achat Loi EGAlim
                </p>

                <div className="space-y-2 font-medium text-gray-700">
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span>Quota de Bio requis :</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-12 text-right font-bold border border-emerald-300 rounded px-1"
                          value={egalimQuota}
                          onChange={(e) => setEgalimQuota(e.target.value)}
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-900">
                        {config?.egalimBioQuota || 20} % (AB)
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-1">
                    <span>Produits EGAlim :</span>
                    <span className="font-bold text-gray-900">
                      50% durables
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Format Facture :</span>
                    <span className="font-bold text-gray-900">
                      Factur-X XML
                    </span>
                  </div>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="pt-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveQuota}
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
                      className="w-full flex items-center justify-center gap-1 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold py-1.5 px-3 rounded text-[10px] uppercase transition"
                    >
                      <Edit2 size={10} />
                      Modifier le quota
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

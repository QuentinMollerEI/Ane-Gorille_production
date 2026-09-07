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

export default function LogisticsDrealHaccp({ config }) {
  const { user } = useAuth();
  const [isRetracted, setIsRetracted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSaved] = useState(false);

  const [tempRange, setTempRange] = useState({
    haccpMinTemp: config?.haccpMinTemp || 2.0,
    haccpMaxTemp: config?.haccpMaxTemp || 6.0,
  });

  const handleSaveTemp = async () => {
    setIsSaving(true);
    try {
      const configDocRef = doc(db, "config", "regulatory");
      await updateDoc(configDocRef, {
        haccpMinTemp: Number(tempRange.haccpMinTemp),
        haccpMaxTemp: Number(tempRange.haccpMaxTemp),
        lastUpdated: new Date().toISOString(),
      });
      setIsEditing(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 4000);
    } catch (error) {
      console.error("Erreur de sauvegarde HACCP :", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">✓</span>
          3. Réglementation Transport (DREAL) & Suivi Sanitaire (HACCP)
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
              <ShieldCheck size={16} /> Températures de consigne HACCP
              enregistrées dans Firestore.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4 text-sm text-gray-600">
              <p>
                <strong>Inscription administrative DREAL</strong> : Dès lors que
                votre micro-entreprise effectue physiquement la livraison des
                marchandises d'autrui (les maraîchers), vous effectuez du
                transport routier public de marchandises [cite: 13, 14]. Vous
                devez impérativement déclarer l'activité à la{" "}
                <strong>DREAL</strong> de votre région, détenir une{" "}
                <strong>licence de transport intérieur léger</strong> et
                souscrire une assurance{" "}
                <strong>
                  Responsabilité Civile Professionnelle (RC Pro) Transport
                </strong>{" "}
                [cite: 13, 14].
              </p>
              <p>
                <strong>
                  Normes Sanitaires HACCP (Règlement CE n°852/2004)
                </strong>{" "}
                : Le transport de légumes et fruits bio, bien que moins sensible
                que la viande ou le poisson, requiert de garantir la continuité
                de la chaîne du froid afin de préserver la qualité
                nutritionnelle et sanitaire [cite: 14]. Les températures réelles
                à la livraison doivent être contrôlées et loggées [cite: 13].
              </p>
            </div>

            {/* Consigne HACCP paramétrable */}
            <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-100 flex flex-col justify-between text-xs space-y-3">
              <div>
                <p className="font-extrabold text-blue-900 mb-2 uppercase tracking-wide">
                  Consigne de Température HACCP
                </p>

                <div className="space-y-2 font-medium text-gray-700">
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span>Température min :</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        className="w-16 text-right font-bold border border-blue-300 rounded px-1"
                        value={tempRange.haccpMinTemp}
                        onChange={(e) =>
                          setTempRange({
                            ...tempRange,
                            haccpMinTemp: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {config?.haccpMinTemp || 2.0} °C
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span>Température max :</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        className="w-16 text-right font-bold border border-blue-300 rounded px-1"
                        value={tempRange.haccpMaxTemp}
                        onChange={(e) =>
                          setTempRange({
                            ...tempRange,
                            haccpMaxTemp: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {config?.haccpMaxTemp || 6.0} °C
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Garantie Financière :</span>
                    <span className="font-bold text-gray-900">900 € (VUL)</span>
                  </div>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="pt-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveTemp}
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
                      className="w-full flex items-center justify-center gap-1 bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold py-1.5 px-3 rounded text-[10px] uppercase transition"
                    >
                      <Edit2 size={10} />
                      Ajuster la cible
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

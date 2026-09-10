import React, { useState, useEffect } from "react";
import { Building, Info, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";

export default function PublicDeliveryForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [accessRules, setAccessRules] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Charger les consignes d'accès enregistrées dans Firestore
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAccessRules(data.accessRules || data.consignesAccess || "");
      }
    });
  }, [user?.uid]);

  // Sauvegarde automatique lors de la perte de focus (onBlur)
  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        accessRules: accessRules.trim(),
        updatedAt: new Date().toISOString(),
      });
      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde consignes d'accès :", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <Building className="text-blue-700" size={18} />
          <span>Spécificités Livraison Collectivité / Cantine Scolaire</span>
        </h3>
        {isSaved && (
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 size={14} /> Enregistré !
          </span>
        )}
      </div>

      <div className="space-y-1">
        <label className="font-bold text-gray-700 flex items-center gap-1.5">
          <Info size={14} className="text-blue-700" />
          <span>
            Consignes d'accès établissement (Protocole de sécurité / Badge) :
          </span>
        </label>
        <textarea
          rows={3}
          placeholder="ex: Présentation à la loge gardien, accès cour d'école uniquement entre 07:00 et 08:00."
          value={accessRules}
          onChange={(e) => setAccessRules(e.target.value)}
          onBlur={handleSave}
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
}

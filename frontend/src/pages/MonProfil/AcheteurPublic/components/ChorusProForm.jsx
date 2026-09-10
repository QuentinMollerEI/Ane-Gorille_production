import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import {
  FileCheck2,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * 🔒 SOUS-COMPOSANT : ChorusProForm.jsx
 * Emplacement : src/pages/MonProfil/AcheteurPublic/components/ChorusProForm.jsx
 * Responsabilité : Saisie des identifiants Chorus Pro / Engagement
 *                  et calcul synchrone de isProfileCompleted dans Firestore.
 */
export default function ChorusProForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    codeServiceChorus: "",
    refEngagement: "",
  });

  // Charger les données Chorus Pro depuis Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchChorusData() {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            codeServiceChorus: data.codeServiceChorus || data.codeService || "",
            refEngagement: data.refEngagement || data.defaultEngagement || "",
          });
        }
      } catch (error) {
        console.error("Erreur chargement Chorus Pro :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChorusData();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid || isSubmitting) return;

    setIsSubmitting(true);
    setIsSaved(false);
    setErrorMessage(null);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      // 🎯 1. Vérification que toutes les coordonnées de base sont présentes
      const hasBaseInfo = Boolean(
        currentData.displayName &&
        currentData.displayName.trim() &&
        currentData.companyName &&
        currentData.companyName.trim() &&
        currentData.siret &&
        currentData.siret.trim() &&
        currentData.phone &&
        currentData.phone.trim() &&
        currentData.address &&
        currentData.address.trim() &&
        currentData.postalCode &&
        currentData.postalCode.trim() &&
        currentData.city &&
        currentData.city.trim(),
      );

      // 🎯 2. Vérification de la présence du Code Chorus ou du N° d'engagement
      const hasChorusInfo = Boolean(
        formData.codeServiceChorus.trim() || formData.refEngagement.trim(),
      );

      // 🎯 3. Calcul dynamique de isProfileCompleted
      const isComplete = hasBaseInfo && hasChorusInfo;

      // 🎯 4. Sauvegarde Firestore AVEC le champ isProfileCompleted
      await updateDoc(userRef, {
        codeServiceChorus: formData.codeServiceChorus.trim(),
        refEngagement: formData.refEngagement.trim(),
        isProfileCompleted: isComplete, // 🎯 BASCULE LE STATUT EN BASE
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Erreur mise à jour Chorus Pro :", error);
      setErrorMessage("Impossible de sauvegarder vos identifiants Chorus Pro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-700" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <FileCheck2 size={16} className="text-blue-700" />
          Paramètres de Télétransmission Chorus Pro (B2G)
        </h3>
        {isSaved && (
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 size={14} /> Enregistré !
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Code Service Chorus Pro
            </label>
            <div className="relative">
              <FileCheck2
                className="absolute left-3 top-2.5 text-blue-600"
                size={16}
              />
              <input
                type="text"
                name="codeServiceChorus"
                value={formData.codeServiceChorus}
                onChange={handleChange}
                placeholder="EX: SERVICE_CANTINE"
                className="w-full pl-9 pr-3 py-2.5 border border-blue-200 rounded-xl bg-blue-50/30 font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Code service utilisé pour orienter la facture vers le bon service
              comptable public.
            </p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              N° d'Engagement Budgétaire (Bon de Commande)
            </label>
            <input
              type="text"
              name="refEngagement"
              value={formData.refEngagement}
              onChange={handleChange}
              placeholder="EX: ENG-2026-990"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Numéro requis pour valider le rapprochement sur Chorus Pro.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Enregistrer Chorus Pro</span>
          </button>
        </div>
      </form>
    </div>
  );
}

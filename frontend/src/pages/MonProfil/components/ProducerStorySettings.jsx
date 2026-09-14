import React, { useState, useEffect } from "react";
import { BookOpen, Save, Loader2, CheckCircle } from "lucide-react";
import { db } from "../../../services/firestore.service";
import { useAuth } from "../../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";

export default function ProducerStorySettings({ profileData, setProfileData, onProfileUpdated }) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Synchronisation avec les données existantes du profil
  useEffect(() => {
    if (profileData?.description || profileData?.bio) {
      setDescription(profileData.description || profileData.bio || "");
    }
  }, [profileData]);

  // Sauvegarde dans Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      setSaving(true);
      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        description: description,
        bio: description, // Synchronisation rétrocompatible
      });

      if (setProfileData) {
        setProfileData((prev) => ({
          ...prev,
          description: description,
          bio: description,
        }));
      }

      if (onProfileUpdated) {
        onProfileUpdated();
      }

      setSuccessMessage("Présentation enregistrée avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la présentation :", error);
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      {/* En-tête de section */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-700" />
          <h2 className="text-sm font-black text-gray-900">
            Présentation & Récit de l'exploitation
          </h2>
        </div>
      </div>

      {/* Notification de succès */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Zone de texte du récit */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 block">
          Racontez l'histoire de votre ferme, vos méthodes de culture et vos engagements
        </label>
        <textarea
          rows={5}
          placeholder="Exemple : Notre exploitation familiale située en région maraîchère cultive des fruits et légumes de saison dans le respect du cahier des charges de l'Agriculture Biologique. Nous favorisons le circuit court et le ramassage à maturité..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3.5 border border-gray-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all bg-gray-50/50 resize-y"
        />
        <p className="text-[10px] text-gray-400 font-medium italic">
          Ce texte sera affiché sur l'onglet "Récit & Présentation" (`ProducerStoryTab`) de votre vitrine producteur auprès des acheteurs.
        </p>
      </div>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Enregistrer la présentation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
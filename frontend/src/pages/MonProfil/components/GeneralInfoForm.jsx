import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { User, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * 🔒 COMPOSANT HARMONISÉ : GeneralInfoForm.jsx
 * Saisie des coordonnées de base et calcul dynamique de isProfileCompleted.
 */
export default function GeneralInfoForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    displayName: "",
    companyName: "",
    siret: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
  });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function loadUserData() {
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            displayName: data.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            phone: data.phone || "",
            address: data.address || "",
            postalCode: data.postalCode || "",
            city: data.city || "",
          });
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des informations générales :",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
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

      // 🎯 1. Vérification des coordonnées de base
      const hasBaseInfo = Boolean(
        formData.displayName.trim() &&
        formData.companyName.trim() &&
        formData.siret.trim() &&
        formData.phone.trim() &&
        formData.address.trim() &&
        formData.postalCode.trim() &&
        formData.city.trim(),
      );

      // 🎯 2. Vérification des spécificités selon le rôle
      const userRole = currentData.role || "acheteur_prive";
      let isRoleComplete = false;

      if (userRole === "acheteur_public") {
        isRoleComplete = Boolean(currentData.siret?.trim());
      } else if (userRole === "acheteur_prive" || userRole === "acheteur") {
        isRoleComplete = Boolean(
          currentData.sepaMandateActive || currentData.iban,
        );
      } else if (userRole === "producteur") {
        isRoleComplete = Boolean(
          currentData.stripeConnectCompleted || currentData.stripeAccountId,
        );
      } else if (userRole === "livreur") {
        isRoleComplete = Boolean(
          currentData.immatriculation?.trim() &&
          currentData.permisValide === true,
        );
      } else if (userRole === "admin") {
        isRoleComplete = true;
      }

      const isComplete = hasBaseInfo && isRoleComplete;

      // 🎯 3. Sauvegarde Firestore avec écriture du statut
      await updateDoc(userRef, {
        displayName: formData.displayName.trim(),
        companyName: formData.companyName.trim(),
        siret: formData.siret.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        city: formData.city.trim(),
        isProfileCompleted: isComplete,
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des coordonnées :", error);
      setErrorMessage("Impossible de sauvegarder les coordonnées générales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <User size={16} className="text-emerald-700" />
          Coordonnées Générales de l'Établissement / Entité
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
              Nom du Référent / Contact *
            </label>
            <input
              type="text"
              name="displayName"
              required
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Nom Prénom"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Raison Sociale / Entité *
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Nom de l'entreprise / Exploitation"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Numéro de SIRET *
            </label>
            <input
              type="text"
              name="siret"
              required
              maxLength="14"
              value={formData.siret}
              onChange={handleChange}
              placeholder="14 chiffres sans espaces"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Téléphone de Contact *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="06 00 00 00 00"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              Adresse Physiques *
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Numéro et nom de rue"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Code Postal *
            </label>
            <input
              type="text"
              name="postalCode"
              required
              maxLength="5"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="31000"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Ville *</label>
          <input
            type="text"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            placeholder="Toulouse"
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Enregistrer les coordonnées</span>
          </button>
        </div>
      </form>
    </div>
  );
}

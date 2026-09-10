import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { checkGeoFence } from "../../../services/logisticsService";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * 🔒 SOUS-COMPOSANT : GeneralInfoForm.jsx
 * Emplacement : src/pages/MonProfil/components/GeneralInfoForm.jsx
 * Responsabilité : Coordonnées générales, validation GeoFence (50 km)
 *                  et mise à jour dynamique de isProfileCompleted dans Firestore.
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
    email: "",
    address: "",
    postalCode: "",
    city: "",
  });

  // Chargement des données Firestore au montage
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            displayName: data.displayName || user.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            address: data.address || "",
            postalCode: data.postalCode || "",
            city: data.city || "",
          });
        }
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
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
      // 🎯 1. Contrôle Géo-Fence (50 km autour du Hub)
      const geoResult = await checkGeoFence(
        formData.postalCode.trim(),
        formData.city.trim(),
        50,
      );

      if (geoResult && geoResult.isEligible === false) {
        setErrorMessage(
          geoResult.message ||
            `Commune non éligible : ${formData.city} se situe à ${geoResult.distanceKm} km du Hub (limite autorisée de 50 km).`,
        );
        setIsSubmitting(false);
        return;
      }

      // 🎯 2. Lecture de l'état global du document pour évaluer la complétude
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};

      // 🎯 3. Calcul dynamique de isProfileCompleted
      const hasBaseInfo = Boolean(
        formData.displayName.trim() &&
        formData.companyName.trim() &&
        formData.siret.trim() &&
        formData.phone.trim() &&
        formData.address.trim() &&
        formData.postalCode.trim() &&
        formData.city.trim(),
      );

      let isComplete = hasBaseInfo;
      const userRole = currentData.role || "acheteur_prive";

      if (userRole === "acheteur_public") {
        const hasChorus = Boolean(
          (currentData.codeServiceChorus &&
            currentData.codeServiceChorus.trim()) ||
          (currentData.codeService && currentData.codeService.trim()) ||
          (currentData.refEngagement && currentData.refEngagement.trim()),
        );
        isComplete = hasBaseInfo && hasChorus;
      } else if (userRole === "producteur") {
        isComplete =
          hasBaseInfo &&
          Boolean(currentData.stripeAccountId || currentData.sepaMandateActive);
      }

      // 🎯 4. Sauvegarde dans Firestore AVEC le champ isProfileCompleted
      await updateDoc(userRef, {
        displayName: formData.displayName.trim(),
        companyName: formData.companyName.trim(),
        siret: formData.siret.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        city: formData.city.trim(),
        isProfileCompleted: isComplete, // 🎯 ÉCRITURE DU STATUT DANS FIRESTORE
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3500);
    } catch (error) {
      console.error("Erreur mise à jour profil :", error);
      setErrorMessage("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-700" size={20} />
        <span className="ml-2 text-xs font-bold text-gray-600">
          Chargement...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <User size={16} className="text-emerald-700" />
          Informations Générales & Coordonnées de Livraison
        </h3>
        {isSaved && (
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 size={14} /> Profil mis à jour !
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
              Responsable du compte *
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                name="displayName"
                required
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Jean Dupont"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Raison Sociale / Enseigne *
            </label>
            <div className="relative">
              <Building2
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Raison sociale"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Numéro SIRET (14 chiffres) *
            </label>
            <input
              type="text"
              name="siret"
              required
              maxLength={14}
              value={formData.siret}
              onChange={handleChange}
              placeholder="12345678900012"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Téléphone Direct *
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              Adresse E-mail de Connexion (Non modifiable)
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="email"
                name="email"
                disabled
                value={formData.email}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION ADRESSE SOUMISE AU GÉOREPÉRAGE 50 KM */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Adresse Civique de Livraison *
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="15 Rue de la République"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
            <div>
              <label className="block font-bold text-emerald-950 mb-1">
                Code Postal *
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-2.5 text-emerald-600"
                  size={16}
                />
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="28380"
                  className="w-full pl-9 pr-3 py-2.5 border border-emerald-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">
                Ville / Commune (GeoFence 50 km) *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="Saint-Rémy-sur-Avre"
                className="w-full p-2.5 border border-emerald-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:bg-gray-300 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Vérification GeoFence...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Enregistrer mon profil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

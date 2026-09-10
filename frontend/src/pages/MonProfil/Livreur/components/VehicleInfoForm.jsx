import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import {
  Truck,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * 🔒 SOUS-COMPOSANT : VehicleInfoForm.jsx
 * Emplacement : src/pages/MonProfil/Livreur/components/VehicleInfoForm.jsx
 * Responsabilité : Saisie des informations du véhicule logistique, vérification du permis
 *                  et calcul synchrone de isProfileCompleted pour le rôle Livreur.
 */
export default function VehicleInfoForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    immatriculation: "",
    typeVehicule: "fourgon_frigo",
    permisValide: true,
  });

  // Charger les informations du véhicule depuis Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchVehicleData() {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            immatriculation: data.immatriculation || "",
            typeVehicule: data.typeVehicule || "fourgon_frigo",
            permisValide:
              data.permisValide !== undefined ? data.permisValide : true,
          });
        }
      } catch (error) {
        console.error("Erreur chargement données véhicule :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicleData();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

      // 🎯 1. Vérification des coordonnées de base communes
      const hasBaseInfo = Boolean(
        currentData.displayName?.trim() &&
        currentData.companyName?.trim() &&
        currentData.siret?.trim() &&
        currentData.phone?.trim() &&
        currentData.address?.trim() &&
        currentData.postalCode?.trim() &&
        currentData.city?.trim(),
      );

      // 🎯 2. Vérification des données du véhicule
      const hasVehicleInfo = Boolean(
        formData.immatriculation.trim() && formData.permisValide === true,
      );

      // 🎯 3. Calcul dynamique de la complétude
      const isComplete = hasBaseInfo && hasVehicleInfo;

      // 🎯 4. Mise à jour dans Firestore
      await updateDoc(userRef, {
        immatriculation: formData.immatriculation.trim().toUpperCase(),
        typeVehicule: formData.typeVehicule,
        permisValide: formData.permisValide,
        isProfileCompleted: isComplete, // 🎯 ÉCRITURE DU STATUT DANS FIRESTORE
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Erreur mise à jour véhicule :", error);
      setErrorMessage(
        "Impossible de sauvegarder les informations du véhicule.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-700" size={20} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <Truck size={16} className="text-amber-700" />
          Informations du Véhicule Logistique & Transport
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
              Plaque d'Immatriculation du Véhicule *
            </label>
            <input
              type="text"
              name="immatriculation"
              required
              value={formData.immatriculation}
              onChange={handleChange}
              placeholder="EX: AA-123-BB"
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-bold uppercase focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Type de Véhicule de Transport *
            </label>
            <select
              name="typeVehicule"
              value={formData.typeVehicule}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="fourgon_frigo">
                Fourgon Frigorifique HACCP (2°C - 6°C)
              </option>
              <option value="utilitaire_standard">Utilitaire Isotherme</option>
              <option value="camion_porteur">
                Camion Porteur Frigorifique
              </option>
              <option value="autre">Autre Véhicule Logistique</option>
            </select>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-3">
          <input
            type="checkbox"
            id="permisValide"
            name="permisValide"
            checked={formData.permisValide}
            onChange={handleChange}
            className="h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
          />
          <label
            htmlFor="permisValide"
            className="font-bold text-amber-950 cursor-pointer select-none"
          >
            Je certifie être titulaire d'un permis de conduire valide adapté au
            véhicule enregistré.
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>Enregistrer le véhicule</span>
          </button>
        </div>
      </form>
    </div>
  );
}

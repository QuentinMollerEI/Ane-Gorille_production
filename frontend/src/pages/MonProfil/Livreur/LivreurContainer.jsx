import React, { useState } from "react";
import { Save } from "lucide-react";
import VehicleForm from "./components/VehicleForm";
import TourSelectorForm from "./components/TourSelectorForm";

/**
 * 🚛 CONTAINER PARENT DU RÔLE : LivreurContainer.jsx
 * Emplacement : src/pages/MonProfil/Livreur/LivreurContainer.jsx
 * Responsabilité unique : Orchestrer le sous-domaine de livraison logistique.
 */
export default function LivreurContainer({
  profileData,
  onChange,
  onSave,
  saving,
}) {
  const [errors, setErrors] = useState({});

  const validateDriver = () => {
    const newErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      newErrors.companyName =
        "La dénomination sociale de l'entreprise est obligatoire.";
    }

    if (!profileData?.siret?.trim()) {
      newErrors.siret = "Le numéro de SIRET est obligatoire.";
    } else if (siretClean.length !== 14 || isNaN(Number(siretClean))) {
      newErrors.siret =
        "Un SIRET français doit comporter exactement 14 chiffres.";
    }

    if (!profileData?.vatNumber?.trim()) {
      newErrors.vatNumber =
        "Le numéro de TVA intracommunautaire est obligatoire.";
    }

    if (!profileData?.transportLicense?.trim()) {
      newErrors.transportLicense =
        "Le numéro de licence de transport DREAL est obligatoire.";
    }

    if (!profileData?.transportLicenseExpiry) {
      newErrors.transportLicenseExpiry =
        "La date d'expiration de la licence est requise.";
    }

    if (!profileData?.vehiclePlate?.trim()) {
      newErrors.vehiclePlate =
        "La plaque d'immatriculation du véhicule est obligatoire.";
    }

    if (!profileData?.maxLoadCapacity || profileData.maxLoadCapacity <= 0) {
      newErrors.maxLoadCapacity =
        "La capacité de charge maximale du véhicule est requise.";
    }

    if (!profileData?.volumeCapacity || profileData.volumeCapacity <= 0) {
      newErrors.volumeCapacity = "Le volume utile du véhicule est requis.";
    }

    if (!profileData?.activePickupTour && !profileData?.activeDeliveryTour) {
      newErrors.noTourSelected =
        "Vous devez vous inscrire à au moins une des deux tournées (Ramassage ou Livraison).";
    }

    if (!profileData?.hasSanitaryCertificate) {
      newErrors.hasSanitaryCertificate =
        "La certification de détention de l'attestation sanitaire (HACCP) est obligatoire.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(validateDriver, () => {
      return {
        siret: (profileData?.siret || "").replace(/\s/g, ""),
        role: "driver",
      };
    });
  };

  return (
    <div className="space-y-6">
      <VehicleForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      <TourSelectorForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save size={16} />
          <span>
            {saving
              ? "Enregistrement Livreur..."
              : "Enregistrer mon Profil Livreur"}
          </span>
        </button>
      </div>
    </div>
  );
}

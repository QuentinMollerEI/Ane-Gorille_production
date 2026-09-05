import React, { useState } from "react";
import { Save } from "lucide-react";
import BioCertificationForm from "./components/BioCertificationForm";
import StripeConnectForm from "./components/StripeConnectForm";
import HarvestLogisticsForm from "./components/HarvestLogisticsForm";

/**
 * 🧑‍🌾 CONTAINER PARENT DU RÔLE : ProducteurContainer.jsx
 * Emplacement : src/pages/MonProfil/Producteur/ProducteurContainer.jsx
 * Responsabilité unique : Orchestrer le sous-domaine de production agricole (Maraîchage de proximité).
 */
export default function ProducteurContainer({
  profileData,
  onChange,
  onSave,
  saving,
}) {
  const [errors, setErrors] = useState({});

  const validateProducer = () => {
    const newErrors = {};
    const siretClean = (profileData?.siret || "").replace(/\s/g, "");

    if (!profileData?.companyName?.trim()) {
      newErrors.companyName = "Le nom de l'exploitation est obligatoire.";
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

    if (!profileData?.iduAdeme?.trim()) {
      newErrors.iduAdeme =
        "L'Identifiant Unique ADEME (REP) est requis pour l'étiquetage.";
    }

    if (!profileData?.harvestPhone?.trim()) {
      newErrors.harvestPhone = "Le téléphone d'urgence hangar est obligatoire.";
    }

    if (!profileData?.producerAddress?.trim()) {
      newErrors.producerAddress =
        "L'adresse physique de ramassage est requise.";
    }

    if (profileData?.isBio) {
      if (!profileData?.bioCertificationNumber?.trim()) {
        newErrors.bioCertificationNumber =
          "Le numéro d'agrément Bio est obligatoire.";
      }
      if (!profileData?.bioControlBody) {
        newErrors.bioControlBody = "L'organisme certificateur est requis.";
      }
      if (!profileData?.bioCertificateExpiry) {
        newErrors.bioCertificateExpiry =
          "La date d'expiration de la certification est requise.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(validateProducer, () => {
      return {
        siret: (profileData?.siret || "").replace(/\s/g, ""),
        role: "producer",
      };
    });
  };

  return (
    <div className="space-y-6">
      <HarvestLogisticsForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      <BioCertificationForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      <StripeConnectForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save size={16} />
          <span>
            {saving
              ? "Enregistrement Maraîcher..."
              : "Enregistrer mon Profil Maraîcher"}
          </span>
        </button>
      </div>
    </div>
  );
}

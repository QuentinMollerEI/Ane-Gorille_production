import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import ChorusProForm from "./components/ChorusProForm";
import PublicDeliveryForm from "./components/PublicDeliveryForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

/**
 * 🔒 CONTENEUR : AcheteurPublicContainer.jsx
 * Emplacement : src/pages/MonProfil/AcheteurPublic/AcheteurPublicContainer.jsx
 * Connecte la vérification du hook useProfileCompletion au composant d'en-tête.
 */
export default function AcheteurPublicContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      {/* 🎯 Transmission de la prop isComplete avec la valeur dynamique du hook */}
      <ProfileHeader
        roleLabel="Acheteur Public (B2G / Cantines Scolaires & Collectivités)"
        isComplete={isProfileCompleted}
      />

      {/* Synchronisation de la relecture de base à chaque mise à jour */}
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <ChorusProForm onProfileUpdated={refetchProfile} />
      <PublicDeliveryForm onProfileUpdated={refetchProfile} />
    </div>
  );
}

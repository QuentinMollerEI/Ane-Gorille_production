import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import ChorusProForm from "./components/ChorusProForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";
import { Landmark } from "lucide-react";

export default function AcheteurPublicContainer() {
  // LIAISON DU HOOK DE SÉCURITÉ
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Acheteur Public (B2G / Cantines Scolaires & Collectivités)"
        isComplete={isProfileCompleted}
        icon={Landmark}
      />
      {/* Passage du trigger de re-validation à tous les formulaires */}
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <ChorusProForm onProfileUpdated={refetchProfile} />
    </div>
  );
}
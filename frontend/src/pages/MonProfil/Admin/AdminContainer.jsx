import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

/**
 * 🔒 CONTENEUR HARMONISÉ : AdminContainer.jsx
 */
export default function AdminContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Administrateur Système / Régulation Marketplace"
        roleKey="admin"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
    </div>
  );
}

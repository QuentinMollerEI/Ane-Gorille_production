import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import UserValidationList from "./components/UserValidationList";
import PlatformMetrics from "./components/PlatformMetrics";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function AdminContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        roleLabel="Administrateur Plateforme & Hub Logistique"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <UserValidationList />
      <PlatformMetrics />
    </div>
  );
}

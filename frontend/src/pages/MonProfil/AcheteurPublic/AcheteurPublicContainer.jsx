import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import ChorusProForm from "./components/ChorusProForm";
import PublicDeliveryForm from "./components/PublicDeliveryForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function AcheteurPublicContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        roleLabel="Acheteur Public (B2G / Cantines Scolaires & Collectivités)"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <ChorusProForm />
      <PublicDeliveryForm />
    </div>
  );
}

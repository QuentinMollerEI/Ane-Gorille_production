import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import BillieForm from "./components/BillieForm";
import PrivateDeliveryForm from "./components/PrivateDeliveryForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function AcheteurPriveContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        roleLabel="Acheteur Privé (B2B / Restauration & Entreprises)"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <BillieForm />
      <PrivateDeliveryForm />
    </div>
  );
}

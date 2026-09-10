import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import StripeConnectForm from "../components/StripeConnectForm";
import BioCertificationForm from "./components/BioCertificationForm";
import HarvestLogisticsForm from "./components/HarvestLogisticsForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function ProducteurContainer() {
  const { isProfileCompleted, profileData, refetchProfile } =
    useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        roleLabel="Producteur (Maraîcher / Exploitation Agricole & Vente Directe)"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <StripeConnectForm stripeAccountId={profileData?.stripeAccountId} />
      <BioCertificationForm />
      <HarvestLogisticsForm />
    </div>
  );
}

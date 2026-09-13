import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import StripeOnboardingForm from "./components/StripeOnboardingForm";
import BioCertificationForm from "./components/BioCertificationForm";
import HarvestLogisticsForm from "./components/HarvestLogisticsForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";
import { Sprout } from "lucide-react";

export default function ProducteurContainer() {
  const { isProfileCompleted, profileData, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Producteur (Maraîcher / Exploitation Agricole & Vente Directe)"
        isComplete={isProfileCompleted}
        icon={Sprout}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      {/* Composant Stripe gérant le onboarding (sécurisé) */}
      <StripeOnboardingForm onProfileUpdated={refetchProfile} stripeAccountId={profileData?.stripeAccountId} />
      <BioCertificationForm onProfileUpdated={refetchProfile} />
      <HarvestLogisticsForm onProfileUpdated={refetchProfile} />
    </div>
  );
}
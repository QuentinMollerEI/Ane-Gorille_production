import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import PaymentForm from "./components/PaymentForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";
import { Store } from "lucide-react";

export default function AcheteurPriveContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Acheteur Privé (B2B / Restaurateur)"
        isComplete={isProfileCompleted}
        icon={Store}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      {/* Formulaire contenant la logique du mandat SEPA (ou Billie B2B) */}
      <PaymentForm onProfileUpdated={refetchProfile} />
    </div>
  );
}
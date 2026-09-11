import React from "react";
import { useAuth } from "../../../context/AuthContext";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import PrivateDeliveryForm from "./components/PrivateDeliveryForm";
import PaymentForm from "./components/PaymentForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function AcheteurPriveContainer() {
  const { user } = useAuth();
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Acheteur Privé (B2B / Restaurateur)"
        isComplete={isProfileCompleted}
      />

      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <PrivateDeliveryForm onProfileUpdated={refetchProfile} />

      {/* SEUL ET UNIQUE COMPARTIMENT DE PAIEMENT */}
      <PaymentForm onProfileUpdated={refetchProfile} />
    </div>
  );
}

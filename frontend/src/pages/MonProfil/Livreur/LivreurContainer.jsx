import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import VehicleForm from "./components/VehicleForm";
import TourSelectorForm from "./components/TourSelectorForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";

export default function LivreurContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileHeader
        roleLabel="Livreur (Transporteur, Tournées de Ramassage & HACCP)"
        isComplete={isProfileCompleted}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <VehicleForm />
      <TourSelectorForm />
    </div>
  );
}

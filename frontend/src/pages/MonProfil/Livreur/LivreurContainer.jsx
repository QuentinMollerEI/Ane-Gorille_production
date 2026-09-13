import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import GeneralInfoForm from "../components/GeneralInfoForm";
import VehicleInfoForm from "./components/VehicleInfoForm";
import TourSelectorForm from "./components/TourSelectorForm";
import { useProfileCompletion } from "../../../hooks/useProfileCompletion";
import { Truck } from "lucide-react";

export default function LivreurContainer() {
  const { isProfileCompleted, refetchProfile } = useProfileCompletion();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <ProfileHeader
        roleLabel="Livreur (Transporteur, Tournées de Ramassage & HACCP)"
        isComplete={isProfileCompleted}
        icon={Truck}
      />
      <GeneralInfoForm onProfileUpdated={refetchProfile} />
      <VehicleInfoForm onProfileUpdated={refetchProfile} />
      <TourSelectorForm onProfileUpdated={refetchProfile} />
    </div>
  );
}
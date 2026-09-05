import React from "react";
import ChorusProForm from "./components/ChorusProForm";
import PublicDeliveryForm from "./components/PublicDeliveryForm";

/**
 * 🏛️ SOUS-CONTAINER : AcheteurPublicContainer.jsx (Modulaire & Pur)
 * Responsabilité unique : Présenter les formulaires de l'acheteur public (B2G / Chorus Pro).
 * Reçoit l'état et les erreurs du parent centralisé MonProfilContainer.
 */
export default function AcheteurPublicContainer({
  profileData,
  onChange,
  errors,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Formulaire d'engagement et informations Chorus Pro */}
      <ChorusProForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      {/* Formulaire de livraison publique */}
      <PublicDeliveryForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />
    </div>
  );
}

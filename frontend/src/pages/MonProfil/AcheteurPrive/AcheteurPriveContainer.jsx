import React from "react";
import BillieForm from "./components/BillieForm";
import PrivateDeliveryForm from "./components/PrivateDeliveryForm";

/**
 * 🏢 SOUS-CONTAINER : AcheteurPriveContainer.jsx (Modulaire & Pur)
 * Responsabilité unique : Présenter les formulaires de l'acheteur privé (B2B).
 * Reçoit l'état et les erreurs du parent centralisé MonProfilContainer.
 */
export default function AcheteurPriveContainer({
  profileData,
  onChange,
  errors,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Formulaire de facturation d'entreprise (Billie B2B) */}
      <BillieForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />

      {/* Formulaire de livraison privée (Tournées) */}
      <PrivateDeliveryForm
        profileData={profileData}
        onChange={onChange}
        errors={errors}
      />
    </div>
  );
}

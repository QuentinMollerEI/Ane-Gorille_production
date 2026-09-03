import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ManualAddCompartment from "./components/ManualAddCompartment";
import CsvImportCompartment from "./components/CsvImportCompartment.jsx";
import StockCompartment from "./components/StockCompartment";

export default function MiseEnRayon() {
  const { user } = useAuth();
  // Vérification de la conformité du producteur depuis son profil (ex: Dépôt des certifications)
  const hasValidCertifications = user?.certifications?.isValidated || false;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mise en rayon & Catalogue
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos produits, vos prix et vos stocks pour le marché B2B/B2G.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ManualAddCompartment hasValidCertifications={hasValidCertifications} />
        <CsvImportCompartment />
        <StockCompartment />
      </div>
    </div>
  );
}

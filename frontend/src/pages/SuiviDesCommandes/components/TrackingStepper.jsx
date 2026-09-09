import React from "react";
import { Check, ClipboardList, Truck, CheckCircle } from "lucide-react";

/**
 * 🗺️ COMPOSANT : TrackingStepper.jsx (v4 - Harmonisation Logistique)
 * Responsabilité unique : Afficher l'état d'avancement physique d'une commande
 * à partir des statuts réels synchronisés depuis Firestore.
 */
export default function TrackingStepper({ status }) {
  // Détermination de l'étape active en fonction du statut Firestore réel [cite: 73]
  let currentStep = 1; // Par défaut : Commande enregistrée
  if (status === "EN_COURS_DE_LIVRAISON" || status === "EXPEDIE") {
    currentStep = 2; // En transit logistique [cite: 73]
  } else if (status === "TERMINE" || status === "LIVRE") {
    currentStep = 3; // Livré & Archivé ! [cite: 73]
  }

  const steps = [
    {
      id: 1,
      label: "Récolte & Préparation",
      desc: "Les maraîchers récoltent et étiquettent vos denrées fraîches.",
      icon: ClipboardList,
    },
    {
      id: 2,
      label: "Tournée de Livraison",
      desc: "Le livreur a pris en charge votre panier mutualisé.",
      icon: Truck,
    },
    {
      id: 3,
      label: "Remis en main propre",
      desc: "Livraison validée, contrôle HACCP et émargement scellé.",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="w-full py-6 px-2">
      {/* Ligne visuelle de progression */}
      <div className="relative flex items-center justify-between">
        {/* Barre grise de fond */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full" />

        {/* Barre verte de progression dynamique */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-700 rounded-full"
          style={{
            width:
              currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
          }}
        />

        {/* Rendu des bulles d'étapes */}
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  isCompleted
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                    : isActive
                      ? "bg-white border-emerald-600 text-emerald-700 shadow-lg scale-110 ring-4 ring-emerald-50"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check size={16} className="stroke-[3]" />
                ) : (
                  <Icon size={18} />
                )}
              </div>

              {/* Labels descriptifs */}
              <div className="text-center mt-3 max-w-[150px] md:max-w-[200px]">
                <p
                  className={`text-xs font-black tracking-tight ${isActive ? "text-emerald-800" : isCompleted ? "text-gray-800" : "text-gray-400"}`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5 hidden md:block">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

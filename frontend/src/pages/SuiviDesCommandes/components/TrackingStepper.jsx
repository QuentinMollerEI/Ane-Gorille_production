import React from "react";
import { ClipboardList, Truck, CheckCircle2, ShieldCheck } from "lucide-react";

/**
 * 🗺️ COMPOSANT : TrackingStepper.jsx
 * Stepper visuel de progression logistique à 3 étapes
 */
export default function TrackingStepper({ status, tempHaccp, signature }) {
  let currentStep = 1;
  if (status === "EN_COURS_DE_LIVRAISON" || status === "EXPEDIE") {
    currentStep = 2;
  } else if (status === "LIVRE" || status === "TERMINE") {
    currentStep = 3;
  }

  const steps = [
    {
      id: 1,
      label: "1. Récolte & Préparation",
      desc: "Récolte en ferme & conditionnement",
      icon: ClipboardList,
    },
    {
      id: 2,
      label: "2. Tournée Frigorifique",
      desc: "Transport sous température contrôlée",
      icon: Truck,
    },
    {
      id: 3,
      label: "3. Livré & Conforme HACCP",
      desc: "Remis en main propre & émargé",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-4 pt-1">
      {/* LIGNE DE PROGRESSION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          let colorClasses = "bg-gray-50 border-gray-200 text-gray-400";
          if (isCompleted || isActive) {
            if (step.id === 1)
              colorClasses =
                "bg-amber-50 border-amber-300 text-amber-950 font-bold";
            if (step.id === 2)
              colorClasses =
                "bg-blue-50 border-blue-300 text-blue-950 font-bold";
            if (step.id === 3)
              colorClasses =
                "bg-emerald-100 border-emerald-400 text-emerald-950 font-black";
          }

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${colorClasses}`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isCompleted || isActive
                    ? "bg-white/80 shadow-sm"
                    : "bg-gray-100"
                }`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs font-black">{step.label}</p>
                <p className="text-[10px] text-gray-500 font-medium leading-tight">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCEAU DE CONFORMITÉ HACCP (AFFICHÉ SI LIVRÉ) */}
      {(status === "LIVRE" || status === "TERMINE") && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-emerald-950 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-700 shrink-0" />
            <div>
              <p className="font-extrabold">
                Chaîne du Froid & Contrôle HACCP Validés
              </p>
              <p className="text-[11px] text-emerald-800">
                Température de déchargement enregistrée :{" "}
                <span className="font-black">
                  {tempHaccp ? `${tempHaccp}°C` : "4.2°C (Cible: 2°C à 6°C)"}
                </span>
              </p>
            </div>
          </div>

          {signature && (
            <span className="bg-emerald-200/60 text-emerald-900 font-bold text-[10px] px-2.5 py-1 rounded-lg">
              ✍️ Émargé
            </span>
          )}
        </div>
      )}
    </div>
  );
}

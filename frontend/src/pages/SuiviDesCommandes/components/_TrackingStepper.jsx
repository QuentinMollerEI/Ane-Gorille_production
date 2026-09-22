import React from "react";
import { CheckCircle2, Clock, Truck, ShieldCheck, Package } from "lucide-react";

/**
 * 🚦 COMPOSANT : TrackingStepper.jsx
 * Emplacement : src/pages/SuiviDesCommandes/components/TrackingStepper.jsx
 * 
 * Responsabilité Unique (SRP) :
 * Afficher l'indicateur visuel d'avancement étape par étape de la commande
 * (Validation -> Récolte -> Ramassage Camion -> Livraison Finale).
 */
export default function TrackingStepper({ status = "paid" }) {
  const steps = [
    {
      key: "paid",
      label: "Commande Validée",
      sublabel: "Paiement Scellé",
      icon: CheckCircle2,
    },
    {
      key: "preparing",
      label: "En Récolte Maraîchère",
      sublabel: "Cueillette aux Champs",
      icon: Clock,
    },
    {
      key: "ready_for_pickup",
      label: "Prêt au Ramassage",
      sublabel: "Cagettes Plastiques HACCP",
      icon: Package,
    },
    {
      key: "delivered",
      label: "Livré & Émargé",
      sublabel: "Chaîne du Froid Validée",
      icon: ShieldCheck,
    },
  ];

  // Détermination de l'étape courante
  const getStepIndex = (st) => {
    if (st === "delivered") return 3;
    if (st === "ready_for_pickup" || st === "A_RAMASSER" || st === "PRET_A_EXPEDIER" || st === "EXPEDIE") return 2;
    if (st === "preparing" || st === "HARVESTING" || st === "A_PREPARER") return 1;
    return 0; // paid
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs text-xs font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          let badgeStyle = "bg-slate-100 text-slate-400 border-slate-200";
          let iconColor = "text-slate-400";
          let textColor = "text-slate-500";

          if (isCompleted) {
            badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
            iconColor = "text-emerald-700";
            textColor = "text-slate-900";
          } else if (isCurrent) {
            badgeStyle = "bg-emerald-700 text-white border-emerald-800 shadow-xs animate-pulse";
            iconColor = "text-white";
            textColor = "text-emerald-950 font-black";
          }

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all ${badgeStyle}`}>
                  <Icon size={16} className={iconColor} />
                </div>
                <div className="min-w-0">
                  <p className={`font-extrabold text-[11px] truncate ${textColor}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {step.sublabel}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-0.5 bg-slate-200 mx-2 shrink-0">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

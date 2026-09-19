import React from "react";
import { CheckCircle2, Clock, PackageCheck, Truck, CheckCheck, XCircle } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingStepper.jsx
 * Progression visuelle par étapes de la commande (Commandé -> Récolté -> Enlevé -> En Livraison -> Livré).
 */
export default function TrackingStepper({ status = "paid" }) {
  const st = (status || "").toLowerCase();

  if (st === "cancelled" || st === "annulee") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-800 font-bold text-xs">
        <XCircle size={18} className="shrink-0 text-red-600" />
        <span>Commande annulée</span>
      </div>
    );
  }

  const steps = [
    { key: "paid", label: "Payée", icon: CheckCircle2, desc: "Paiement Stripe valide" },
    { key: "preparing", label: "Récolte & Préparation", icon: Clock, desc: "Cueillette & Lot HACCP" },
    { key: "ready_for_pickup", label: "Colis Scellé", icon: PackageCheck, desc: "Caisse consignée prête" },
    { key: "in_transit", label: "En Livraison", icon: Truck, desc: "Livreur Âne & Gorille" },
    { key: "delivered", label: "Livrée", icon: CheckCheck, desc: "Réception confirmée" },
  ];

  const getStepIndex = (rawStatus) => {
    const s = (rawStatus || "").toLowerCase();
    switch (s) {
      case "pending":
      case "paid":
      case "a_preparer":
        return 0;
      case "preparing":
      case "harvesting":
      case "en_preparation":
        return 1;
      case "ready_for_pickup":
      case "ready_to_ship":
      case "a_ramasser":
      case "pret_a_expedier":
        return 2;
      case "in_transit":
      case "shipping":
      case "expedie":
      case "en_cours_de_livraison":
        return 3;
      case "delivered":
      case "livre":
      case "termine":
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(st);

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-5 gap-1 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          let circleStyle = "bg-gray-100 text-gray-400 border-gray-200";
          let textColor = "text-gray-400 font-semibold";

          if (isCompleted) {
            circleStyle = "bg-emerald-700 text-white border-emerald-700 shadow-sm";
            textColor = "text-emerald-900 font-bold";
          } else if (isCurrent) {
            circleStyle = "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-100 animate-pulse";
            textColor = "text-amber-900 font-extrabold";
          }

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
              {/* Ligne de connexion entre cercles */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-1 -z-10 transition-colors ${
                    idx < currentIndex ? "bg-emerald-600" : "bg-gray-200"
                  }`}
                />
              )}

              {/* Cercle d'étape */}
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${circleStyle}`}
              >
                <StepIcon size={16} />
              </div>

              {/* Titre & Description */}
              <span className={`text-[10px] mt-1.5 leading-tight ${textColor}`}>
                {step.label}
              </span>
              <span className="hidden md:block text-[8px] text-gray-400 mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

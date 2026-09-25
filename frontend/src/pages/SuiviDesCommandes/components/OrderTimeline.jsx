import React from "react";
import { CheckCircle2, Clock, Truck, PackageCheck } from "lucide-react";

export default function OrderTimeline({ status }) {
  const steps = [
    { key: "A_PREPARER", label: "En Préparation", icon: Clock },
    { key: "EN_LIVRAISON", label: "En Livraison", icon: Truck },
    { key: "LIVREE", label: "Livrée", icon: PackageCheck }
  ];

  const getCurrentStepIndex = () => {
    if (status === "EN_LIVRAISON") return 1;
    if (status === "LIVREE") return 2;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="flex items-center justify-between w-full py-4 border-t border-b border-slate-100 my-3">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isPassed = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                isPassed
                  ? "bg-emerald-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isPassed ? <CheckCircle2 size={16} /> : <Icon size={14} />}
            </div>
            <span
              className={`text-[10px] font-extrabold uppercase mt-1.5 text-center ${
                isCurrent ? "text-emerald-800" : isPassed ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
import React from "react";
import { Landmark, Receipt } from "lucide-react";

export default function ChorusProStatus({ invoice }) {
  const getChorusSteps = () => {
    const isPaid = invoice.status === "LIVRE" || invoice.status === "DELIVERED";
    return [
      {
        step: 1,
        label: "Dépôt",
        desc: "Factur-X envoyé à Chorus",
        current: true,
        complete: true,
      },
      {
        step: 2,
        label: "Reçue",
        desc: "Validée par le portail d'État",
        current: !isPaid,
        complete: true,
      },
      {
        step: 3,
        label: "Mise à disposition",
        desc: "Transmise au comptable public",
        current: !isPaid,
        complete: true,
      },
      {
        step: 4,
        label: "Mise en paiement",
        desc: "Ordonnancement comptable",
        current: false,
        complete: isPaid,
      },
      {
        step: 5,
        label: "Payée",
        desc: "Règlement Mandat Administratif",
        current: false,
        complete: isPaid,
      },
    ];
  };

  const steps = getChorusSteps();
  const currentStep = steps.filter((s) => s.complete).pop()?.step || 1;

  return (
    <div className="bg-blue-50/40 border border-blue-150 p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-100 pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
            <Landmark size={13} className="text-blue-700" /> Données de Dépôt
            Chorus Pro B2G
          </span>
          <p className="text-xs font-bold text-gray-800 flex items-center gap-2">
            <span>
              Identifiant Flux : CHORUS-TX-
              {invoice.id.substring(0, 6).toUpperCase()}
            </span>
          </p>
        </div>

        {invoice.engagementNumber && (
          <div className="bg-white border border-blue-150 text-[10px] text-blue-900 font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
            <Receipt size={12} className="text-blue-700" />
            <span>N° Engagement : {invoice.engagementNumber}</span>
          </div>
        )}
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-2 pt-2">
        <div className="absolute hidden md:block top-4 left-[10%] right-[10%] h-0.5 bg-gray-250 z-0" />
        <div
          className="absolute hidden md:block top-4 left-[10%] h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={{ width: `${(currentStep - 1) * 20}%` }}
        />

        {steps.map((s) => (
          <div
            key={s.step}
            className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                s.complete
                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                  : s.current
                    ? "bg-white border-blue-500 text-blue-700 animate-pulse"
                    : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {s.step}
            </div>
            <div className="text-left md:text-center">
              <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
                {s.label}
              </p>
              <p className="text-[8px] text-gray-400 font-medium leading-normal mt-0.5 max-w-[120px] mx-auto">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

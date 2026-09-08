import React from "react";
import { FileText } from "lucide-react";
import PrivateLegalContext from "./components/PrivateLegalContext";
import PrivateIndicators from "./components/PrivateIndicators";
import PrivateDocumentsTable from "./components/PrivateDocumentsTable";

export default function PiecesComptablePrive({ documents }) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileText size={28} />
          </span>
          Pièces Comptables (B2B / B2C)
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Espace Acheteur Privé : Justificatifs d'achats et transactions Stripe.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <PrivateLegalContext />
        <PrivateIndicators documents={documents} />
        <PrivateDocumentsTable documents={documents} />
      </div>
    </div>
  );
}

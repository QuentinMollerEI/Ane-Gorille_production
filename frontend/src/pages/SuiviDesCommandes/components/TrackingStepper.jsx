import React from "react";

/**
 * 📊 COMPOSANT : TrackingStepper.jsx
 * CHEMIN DE DESTINATION : src/pages/SuiviDesCommandes/components/TrackingStepper.jsx
 * Responsabilité unique : Modélisation graphique de la frise de livraison (workflow linéaire).
 * Calcule l'alignement et la coloration active des jalons de 1 à 5.
 */
export default function TrackingStepper({ workflow }) {
  return (
    <div className="px-6 pb-6 border-b border-gray-100">
      <div className="relative flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-2 mt-4">
        {/* Ligne de connexion inactive (arrière-plan) */}
        <div className="absolute hidden md:block top-4 left-[10%] right-[10%] h-0.5 bg-gray-100 z-0" />

        {/* Ligne de connexion verte active */}
        {workflow.step > 1 && (
          <div
            className="absolute hidden md:block top-4 left-[10%] h-0.5 bg-green-600 z-0 transition-all duration-500"
            style={{ width: `${(workflow.step - 1) * 20}%` }}
          />
        )}

        {/* Jalon 1 : Commande Enregistrée */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              workflow.step >= 1
                ? "bg-green-600 border-green-600 text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-400"
            }`}
          >
            1
          </div>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
              Enregistrée
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Paiement sécurisé validé
            </p>
          </div>
        </div>

        {/* Jalon 2 : Récolte */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              workflow.step >= 2
                ? "bg-green-600 border-green-600 text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-400"
            }`}
          >
            2
          </div>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
              En Récolte
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Conditionnement maraîcher
            </p>
          </div>
        </div>

        {/* Jalon 3 : Hangar */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              workflow.step >= 3
                ? "bg-green-600 border-green-600 text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-400"
            }`}
          >
            3
          </div>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
              Prête
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Validation HACCP terminée
            </p>
          </div>
        </div>

        {/* Jalon 4 : Livraison */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              workflow.step >= 4
                ? "bg-green-600 border-green-600 text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-400"
            }`}
          >
            4
          </div>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
              En route
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Distribution circuit-court
            </p>
          </div>
        </div>

        {/* Jalon 5 : Finalisé */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              workflow.step >= 5
                ? "bg-green-600 border-green-600 text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-400"
            }`}
          >
            5
          </div>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-black uppercase text-gray-800 leading-tight">
              Livrée
            </p>
            <p className="text-[9px] text-gray-400 mt-0.5">
              Colis remis en main propre
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

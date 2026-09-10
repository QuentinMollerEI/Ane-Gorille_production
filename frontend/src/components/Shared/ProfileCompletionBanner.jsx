import React from "react";
import { Link } from "react-router-dom";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * 📢 COMPOSANT : ProfileCompletionBanner.jsx
 * Responsabilité unique : Affichage incitatif de la complétude du profil en haut de l'espace de travail.
 */
export default function ProfileCompletionBanner() {
  const { isProfileCompleted, missingFields, loading } = useProfileCompletion();

  if (loading || isProfileCompleted) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
        <div>
          <span className="font-extrabold text-amber-950">
            Profil incomplet :{" "}
          </span>
          <span>
            Certaines informations requises ({missingFields.join(", ")}) sont
            manquantes pour valider votre compte.
          </span>
        </div>
      </div>

      <Link
        to="/mon-profil"
        className="shrink-0 bg-amber-800 hover:bg-amber-900 text-white font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Compléter mon profil</span>
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * 🛡️ COMPOSANT : RequireProfileCompleted.jsx
 * Responsabilité unique : Guard de navigation forçant la complétude du profil avant d'accéder aux fonctionnalités métier.
 */
export default function RequireProfileCompleted({ children }) {
  const { loading, isProfileCompleted } = useProfileCompletion();
  const location = useLocation();

  // 1. Pendant le chargement de l'état du profil
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-700" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Vérification de la conformité du profil...
        </span>
      </div>
    );
  }

  // 2. Si le profil n'est pas complet, redirection forcée vers /mon-profil
  if (!isProfileCompleted) {
    return (
      <Navigate
        to="/mon-profil"
        state={{
          from: location,
          message:
            "Veuillez compléter vos informations de profil (SIRET, Adresse) pour débloquer l'accès aux services.",
        }}
        replace
      />
    );
  }

  // 3. Si le profil est conforme, accès autorisé au composant enfant
  return children;
}

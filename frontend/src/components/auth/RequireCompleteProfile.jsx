import React from "react";
import { useProfileCompletion } from "../../hooks/useProfileCompletion";
import { AlertOctagon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * COMPOSANT DE SÉCURITÉ : RequireCompleteProfile
 * Encapsule les fonctionnalités critiques (Checkout, Mise en rayon, etc.).
 * Si le profil n'est pas 100% complet (Badge Vert), affiche un blocage
 * incitant l'utilisateur à finaliser ses configurations légales et financières.
 */
export default function RequireCompleteProfile({ children, actionName = "utiliser cette fonctionnalité" }) {
  const { isProfileCompleted, isLoadingProfile } = useProfileCompletion();

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  // Si le profil est complet, on affiche l'enfant (le composant fonctionnel)
  if (isProfileCompleted) {
    return <>{children}</>;
  }

  // SINON : Affichage du blocage "Lecture Seule"
  return (
    <div className="relative border border-amber-200 bg-amber-50 rounded-3xl p-8 text-center shadow-sm">
      {/* Voile optionnel si on voulait griser le composant enfant derrière */}
      <div className="flex flex-col items-center max-w-lg mx-auto space-y-4">
        <div className="p-4 bg-amber-100 text-amber-800 rounded-full">
          <AlertOctagon size={48} />
        </div>
        <h3 className="text-xl font-black text-amber-950">
          Action bloquée : Profil Incomplet
        </h3>
        <p className="text-sm font-medium text-amber-800 leading-relaxed">
          Pour des raisons légales et de sécurité financière, vous devez finaliser la configuration de votre espace professionnel (Coordonnées, Stripe, Mandat SEPA ou Chorus Pro) avant de pouvoir {actionName}.
        </p>
        <Link 
          to="/dashboard/profil"
          className="mt-4 px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-xl flex items-center gap-2 transition-colors"
        >
          <span>Finaliser mon Profil</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
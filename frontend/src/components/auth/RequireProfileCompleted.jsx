import React from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * 🔒 GUARD : RequireProfileCompleted.jsx
 * Empêche la boucle de redirection avec PublicOnlyRoute
 */
export default function RequireProfileCompleted({ children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-gray-600">
            Chargement de votre profil...
          </p>
        </div>
      </div>
    );
  }

  // 🎯 On laisse passer l'utilisateur sur le Dashboard même si son profil est en cours de complétion
  return children;
}

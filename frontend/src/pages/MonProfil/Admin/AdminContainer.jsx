import React from "react";
import PlatformMetrics from "./components/PlatformMetrics";
import UserValidationList from "./components/UserValidationList";
import { ShieldCheck } from "lucide-react";

/**
 * 👑 CONTAINER PARENT DU RÔLE : AdminContainer.jsx
 * Emplacement : src/pages/MonProfil/Admin/AdminContainer.jsx
 * Responsabilité unique : Orchestrer le sous-domaine de l'administration et de la supervision de conformité.
 */
export default function AdminContainer() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bandeau d'accueil Administrateur */}
      <div className="flex items-center gap-3 bg-purple-50 border border-purple-150 p-4 rounded-2xl text-xs text-purple-950 font-bold leading-relaxed">
        <ShieldCheck size={20} className="text-purple-700 shrink-0" />
        <span>
          Bienvenue sur votre <strong>Espace de Contrôle Administrateur</strong>
          . Vous pouvez suivre l'activité du réseau d'Âne & Gorille et valider
          les dossiers d'inscription réglementaires des autres professionnels.
        </span>
      </div>

      {/* 1. Métriques de conformité de la plateforme */}
      <PlatformMetrics />

      {/* 2. Liste d'attente de validation d'onboarding */}
      <UserValidationList />
    </div>
  );
}

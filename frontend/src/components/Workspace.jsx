import React from "react";
import { useAuth } from "../context/AuthContext";
import { Wrench } from "lucide-react";

// 1. IMPORTS DES VUES ACTIVES
import ShopContainer from "./ShopContainer";
// Import du composant MiseEnRayon que nous avons déjà créé
import MiseEnRayon from "../pages/MiseEnRayon/MiseEnRayon";

// (ArchiveComptabilite reste commenté tant que son dossier /src/pages/Comptabilite/ n'est pas créé)
// import ArchiveComptabilite from '../pages/Comptabilite/ArchiveComptabilite';

// 2. COMPOSANT DE SÉCURITÉ (Évite le crash sur les onglets non créés)
const TabPlaceholder = ({ title, description }) => (
  <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
    <div className="p-4 bg-gray-50 text-gray-400 rounded-full">
      <Wrench size={32} />
    </div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 max-w-md">{description}</p>
    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
      En cours d'intégration
    </span>
  </div>
);

// 3. ROUTEUR DE L'ESPACE DE TRAVAIL
export default function Workspace({ activeTab }) {
  const { user } = useAuth();
  const role = user?.role || "acheteur";

  if (role === "acheteur") {
    switch (activeTab) {
      case "boutique":
        return <ShopContainer />;
      case "suivi":
        return (
          <TabPlaceholder
            title="Suivi des commandes"
            description="Historique de vos achats en préparation."
          />
        );
      case "compta":
        return (
          <TabPlaceholder
            title="Pièces comptables"
            description="Téléchargement des factures Chorus Pro."
          />
        );
      case "stats":
        return (
          <TabPlaceholder
            title="Statistiques"
            description="Volume de légumes bio consommés."
          />
        );
      default:
        return (
          <TabPlaceholder
            title="Profil Acheteur"
            description="Vos informations de compte."
          />
        );
    }
  }

  if (role === "producteur") {
    switch (activeTab) {
      case "rayon":
        // Affiche désormais le vrai composant avec la sidebar et les compartiments
        return <MiseEnRayon />;
      case "preparation":
        return (
          <TabPlaceholder
            title="Préparation"
            description="Bons de préparation à récolter."
          />
        );
      case "haccp":
        return (
          <TabPlaceholder
            title="Suivi Sanitaire"
            description="Relevés de chambre froide."
          />
        );
      case "compta":
        return (
          <TabPlaceholder
            title="Archive & Comptabilité"
            description="Suivi des virements Stripe."
          />
        );
      default:
        return (
          <TabPlaceholder
            title="Profil Producteur"
            description="Paramètres de l'exploitation."
          />
        );
    }
  }

  if (role === "livreur") {
    switch (activeTab) {
      case "planification":
        return (
          <TabPlaceholder
            title="Planification"
            description="Tournées du jour."
          />
        );
      case "livraison":
        return (
          <TabPlaceholder title="Émargement" description="Bons de livraison." />
        );
      case "haccp":
        return (
          <TabPlaceholder
            title="Chaîne du froid"
            description="Relevés de température transport."
          />
        );
      default:
        return (
          <TabPlaceholder
            title="Profil Transporteur"
            description="Licences DREAL."
          />
        );
    }
  }

  if (role === "admin") {
    switch (activeTab) {
      case "fiscal":
        return (
          <TabPlaceholder
            title="Surveillance Fiscale"
            description="Contrôle des flux Stripe et Chorus Pro."
          />
        );
      case "haccp":
        return (
          <TabPlaceholder
            title="Alertes Sanitaires"
            description="Anomalies de la chaîne du froid."
          />
        );
      default:
        return (
          <TabPlaceholder
            title="Modération"
            description="Tickets d'assistance et catalogue."
          />
        );
    }
  }

  return (
    <div className="text-center py-20 text-gray-400">Onglet introuvable.</div>
  );
}

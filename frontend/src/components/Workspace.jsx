import React from "react";
import { useAuth } from "../context/AuthContext";
import { Wrench } from "lucide-react";

// 1. IMPORTS DES VUES ACTIVES
import ShopContainer from "../pages/boutique/ShopContainer";
import MiseEnRayon from "../pages/MiseEnRayon/MiseEnRayon";
import OrderPreparation from "../pages/Preparation/OrderPreparation";
import MonProfilContainer from "../pages/MonProfil/MonProfilContainer";
import OrderTracking from "../pages/SuiviDesCommandes/OrderTracking";
import RoutePlanner from "../pages/FeuilleDeRoute/RoutePlanner";
import PiecesComptables from "../pages/PiecesComptables/PiecesComptables";

// 🛡️ NOUVEAUX IMPORTS : COMPTABILITÉ PRODUCTEUR ET LIVREUR
import ArchiveComptabiliteProducteur from "../pages/ComptabiliteProducteur/ArchiveProducteur";
import ArchiveComptabiliteLivreur from "../pages/ComptabiliteLivreur/ArchiveLivreur";

// 2. COMPOSANT DE SÉCURITÉ (Évite le crash sur les onglets non encore intégrés)
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

// 3. ROUTEUR DYNAMIQUE DE L'ESPACE DE TRAVAIL (Workspace)
export default function Workspace({ activeTab }) {
  const { user } = useAuth();

  // 🛡️ NORMALISATION DES RÔLES ("Legal by Design" & Robustesse RBAC)
  let role = user?.role || "acheteur";
  if (
    role === "client_pro" ||
    role === "client_public" ||
    role === "acheteur_prive" ||
    role === "acheteur_public" ||
    role === "acheteur"
  ) {
    role = "acheteur";
  }

  // --- RENDU 1 : ONGLET ACHETEUR (PARTICULIER OU ÉTABLISSEMENT PUBLIC) ---
  if (role === "acheteur") {
    switch (activeTab) {
      case "boutique":
        return <ShopContainer />;
      case "suivi":
        return <OrderTracking />;
      case "compta":
        return <PiecesComptables />;
      case "stats":
        return (
          <TabPlaceholder
            title="Statistiques d'achat"
            description="Consultez votre volume de légumes et fruits bio consommés à l'année."
          />
        );
      case "profil":
      default:
        return <MonProfilContainer />;
    }
  }

  // --- RENDU 2 : ONGLET PRODUCTEUR (MARAÎCHER) ---
  if (role === "producteur") {
    switch (activeTab) {
      case "rayon":
        return <MiseEnRayon />;
      case "preparation":
        return <OrderPreparation />;
      case "haccp":
        return (
          <TabPlaceholder
            title="Suivi Sanitaire & HACCP"
            description="Suivi des relevés de température et protocoles de nettoyage en hangar."
          />
        );
      case "compta":
        // Affichage des données comptables du producteur
        return <ArchiveComptabiliteProducteur />;
      case "docs":
        return (
          <TabPlaceholder
            title="Certifications d'Exploitation"
            description="Téléversez et gérez vos labels (AB, HVE, Ecocert) pour la conformité EGAlim."
          />
        );
      case "profil":
      default:
        return <MonProfilContainer />;
    }
  }

  // --- RENDU 3 : ONGLET LIVREUR ---
  if (role === "livreur") {
    switch (activeTab) {
      case "planification":
        return <RoutePlanner />;
      case "haccp":
        return (
          <TabPlaceholder
            title="Contrôle Chaîne du Froid"
            description="Saisie des relevés obligatoires de température lors du transport."
          />
        );
      case "compta":
        // Affichage des données comptables du livreur
        return <ArchiveComptabiliteLivreur />;
      case "dreal":
        return (
          <TabPlaceholder
            title="Conformité DREAL"
            description="Vérification de vos licences de transport et assurances de fret."
          />
        );
      case "profil":
      default:
        return <MonProfilContainer />;
    }
  }

  // --- RENDU 4 : ONGLET ADMINISTRATEUR ---
  if (role === "admin") {
    switch (activeTab) {
      case "fiscal":
        return (
          <TabPlaceholder
            title="Surveillance Fiscale"
            description="Contrôle des flux financiers, Chorus Pro et conformité LME."
          />
        );
      case "haccp":
        return (
          <TabPlaceholder
            title="Centre d'Alertes Sanitaires"
            description="Surveillance en temps réel des ruptures de la chaîne du froid."
          />
        );
      case "moderation":
        return (
          <TabPlaceholder
            title="Modération du Catalogue"
            description="Validation des fiches produits et contrôle des prix de la marketplace."
          />
        );
      case "assistance":
      default:
        return (
          <TabPlaceholder
            title="Support & Assistance"
            description="Gestion des tickets d'assistance et support utilisateurs."
          />
        );
    }
  }

  return (
    <div className="text-center py-20 text-gray-400 italic animate-fade-in">
      Veuillez sélectionner un onglet valide dans la barre de navigation.
    </div>
  );
}

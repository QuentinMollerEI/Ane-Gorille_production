import React from "react";
import { useAuth } from "../context/AuthContext";
import { Wrench } from "lucide-react";

// 1. IMPORTS DES VUES ACTIVES
import ShopContainer from "./ShopContainer";
import MiseEnRayon from "../pages/MiseEnRayon/MiseEnRayon";
import OrderPreparation from "../pages/Preparation/OrderPreparation";
import MyProfile from "../pages/Profil/MyProfile"; // IMPORT DE L'ONGLET PROFIL DYNAMIQUE
import OrderTracking from "../pages/SuiviDesCommandes/OrderTracking";
import RoutePlanner from "../pages/FeuilleDeRoute/RoutePlanner";

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
  // Permet de mapper tous les sous-profils acheteurs (particulier, pro/B2B, public/B2G)
  // vers le canal d'onglets 'acheteur' pour qu'ils aient tous accès à la Boutique, Suivi, Compta et Profil.
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
        return (
          <TabPlaceholder
            title="Suivi des commandes"
            description="Historique de vos achats en cours de préparation."
          />
        );
      case "compta":
        return (
          <TabPlaceholder
            title="Pièces comptables & Chorus Pro"
            description="Téléchargement des factures certifiées et dépôts institutionnels."
          />
        );
      case "stats":
        return (
          <TabPlaceholder
            title="Statistiques d'achat"
            description="Consultez votre volume de légumes et fruits bio consommés à l'année."
          />
        );
      case "profil":
      default:
        return <MyProfile />; // Rendu dynamique de votre onglet Profil unifié
    }
  }

  // --- RENDU 2 : ONGLET PRODUCTEUR (MARAÎCHER) ---
  if (role === "producteur") {
    switch (activeTab) {
      case "rayon":
        // Onglet Mise en Rayon modulaire (Saisie manuelle, Import CSV, Grille de Stocks)
        return <MiseEnRayon />;
      case "preparation":
        // Onglet Préparation modulaire connecté en temps réel (HACCP & Impression Bons de Préparation)
        return <OrderPreparation />;
      case "haccp":
        return (
          <TabPlaceholder
            title="Suivi Sanitaire & HACCP"
            description="Suivi des relevés de température et protocoles de nettoyage en hangar."
          />
        );
      case "compta":
        return (
          <TabPlaceholder
            title="Historique Comptable & Ventes"
            description="Suivi de vos versements et de votre solde séquestre Stripe Connect."
          />
        );
      case "docs":
        return (
          <TabPlaceholder
            title="Certifications d'Exploitation"
            description="Téléversez et gérez vos labels (AB, HVE, Ecocert) pour la conformité EGAlim."
          />
        );
      case "profil":
      default:
        return <MyProfile />; // Rendu dynamique de votre onglet Profil unifié
    }
  }

  // --- RENDU 3 : ONGLET LIVREUR ---
  if (role === "livreur") {
    switch (activeTab) {
      case "planification":
        return <RoutePlanner />;
        return (
          <TabPlaceholder
            title="Planification des tournées"
            description="Visualisez votre feuille de route et les points de retrait programmés."
          />
        );
      case "livraison":
        return (
          <TabPlaceholder
            title="Émargement & Bons de livraison"
            description="Gerez la validation et la signature numérique des livraisons sur site."
          />
        );
      case "haccp":
        return (
          <TabPlaceholder
            title="Contrôle Chaîne du Froid"
            description="Saisie des relevés obligatoires de température lors du transport."
          />
        );
      case "compta":
        return (
          <TabPlaceholder
            title="Relevés de prestations"
            description="Historique de vos facturations logistiques et frais de route."
          />
        );
      case "dreal":
        return (
          <TabPlaceholder
            title="Conformité DREAL"
            description="Vérification de vos licences de transport et assurances de fret."
          />
        );
      case "profil":
      default:
        return <MyProfile />; // Rendu dynamique de votre onglet Profil unifié
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

  // SECURITE DE SECOURS
  return (
    <div className="text-center py-20 text-gray-400 italic">
      Veuillez sélectionner un onglet valide dans la barre de navigation.
    </div>
  );
}

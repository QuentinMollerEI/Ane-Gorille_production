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

// 👑 IMPORTS DE L'ESPACE ADMINISTRATEUR
import AdminContainer from "../pages/MonProfil/Admin/AdminContainer";
import AdminLegalLexicon from "../pages/MonProfil/Admin/AdminLegalLexicon";

// 2. COMPOSANT DE SÉCURITÉ (Évite le crash sur les onglets non encore intégrés)
const TabPlaceholder = ({ title, description }) => (
  <div className="max-w-6xl mx-auto p-10 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 animate-fade-in my-6">
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

/**
 * 🧭 ROUTEUR DYNAMIQUE DE L'ESPACE DE TRAVAIL (Workspace.jsx)
 * Responsabilité unique : Recevoir activeTab depuis Sidebar.jsx et charger le composant correspondant.
 */
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

  // --- RENDU 1 : ONGLET ACHETEUR (PARTICULIER, B2B OU B2G) ---
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
        return <MonProfilContainer />;
    }
  }

  // --- RENDU 3 : ONGLET LIVREUR ---
  if (role === "livreur") {
    switch (activeTab) {
      case "planification":
        return <RoutePlanner />;
      case "livraison":
        return (
          <TabPlaceholder
            title="Feuille de Route & Livraisons"
            description="Consultez et validez vos livraisons avec emargement et releve HACCP."
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
        return <MonProfilContainer />;
    }
  }

  // --- RENDU 4 : ONGLET ADMINISTRATEUR ---
  if (role === "admin") {
    switch (activeTab) {
      case "moderation":
        return <AdminContainer />;

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

      case "assistance":
        return (
          <TabPlaceholder
            title="Support & Assistance"
            description="Gestion des tickets d'assistance et support utilisateurs."
          />
        );

      case "legal":
        // ⚖️ AFFICHE LE CATALOGUE ET LE RÉFÉRENTIEL DES OBLIGATIONS LÉGALES
        return <AdminLegalLexicon />;

      case "profil":
        return <MonProfilContainer />;

      default:
        return <AdminContainer />;
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-center py-20 text-gray-400 italic animate-fade-in">
      Veuillez sélectionner un onglet valide dans la barre de navigation.
    </div>
  );
}

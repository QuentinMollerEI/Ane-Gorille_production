import React from "react";
import { useAuth } from "../context/AuthContext";
import { Wrench } from "lucide-react";

// 1. IMPORTS DES VUES ACTIVES
import ShopContainer from "../pages/Boutique/ShopContainer";
import MiseEnRayon from "../pages/MiseEnRayon/MiseEnRayon";
import OrderPreparation from "../pages/Preparation/OrderPreparation";
import MonProfilContainer from "../pages/MonProfil/MonProfilContainer";
import OrderTracking from "../pages/SuiviDesCommandes/OrderTracking";
import RoutePlanner from "../pages/FeuilleDeRoute/RoutePlanner";
import MyDeliveries from "../pages/MesLivraisons/MyDeliveries";

// 🛡️ IMPORTS EXCLUSIFS DES ONGLETS COMPTABILITÉ & ARCHIVES PAR RÔLE (Clean Code & SRP)
import PiecesComptables from "../pages/PiecesComptables/PiecesComptables";
import ArchiveComptabiliteProducteur from "../pages/ComptabiliteProducteur/ArchiveProducteur";
import ArchiveComptabiliteLivreur from "../pages/ComptabiliteLivreur/ArchiveLivreur";
import ArchiveComptabiliteAdmin from "../pages/ComptabiliteAdmin/ArchiveAdmin";

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

  // --- RENDU 1 : ONGLET ACHETEUR (PARTICULIER, PRO B2B OU ÉTABLISSEMENT PUBLIC B2G) ---
  if (role === "acheteur") {
    switch (activeTab) {
      case "boutique":
        return <ShopContainer />;
      case "suivi":
        return <OrderTracking />;
      case "compta":
        // Rendu de l'onglet de factures de confiance (Factur-X & Chorus Pro)
        return <PiecesComptables />;
      case "stats":
        return (
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-fade-in my-6">
            <h3 className="text-base font-bold text-brand-green flex items-center">
              Statistiques d'achat annuel
            </h3>
            <p className="text-xs text-gray-500">
              Consultez votre volume de légumes et fruits bio consommés à
              l'année.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center pt-2">
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <p className="text-2xl font-extrabold text-brand-green">
                  148 kg
                </p>
                <p className="text-xs text-gray-500">Volume global acquis</p>
              </div>
              <div className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <p className="text-2xl font-extrabold text-brand-gold">100%</p>
                <p className="text-xs text-gray-500">
                  Circuits courts / EGAlim
                </p>
              </div>
            </div>
          </div>
        );
      case "profil":
      default:
        return <MonProfilContainer />; // Rendu dynamique de l'onglet Profil unifié
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
            description="Suivi des relevés de température et de la désinfection du matériel d'exploitation."
          />
        );
      case "compta":
        // Rendu de l'archive comptable personnalisée pour les maraîchers (Stripe Connect, commissions et régime TVA)
        return <ArchiveComptabiliteProducteur />;
      case "docs":
        return (
          <TabPlaceholder
            title="Certifications d'Exploitation"
            description="Téléversez et gérez vos labels (AB, HVE, Ecocert) pour la conformité réglementaire."
          />
        );
      case "profil":
      default:
        return <MonProfilContainer />; // Rendu dynamique de l'onglet Profil unifié
    }
  }

  // --- RENDU 3 : ONGLET LIVREUR ---
  if (role === "livreur") {
    switch (activeTab) {
      case "planification":
        return <RoutePlanner />;
      case "livraison":
        return <MyDeliveries />;
      case "haccp":
        return (
          <TabPlaceholder
            title="Contrôle Chaîne du Froid"
            description="Saisie des relevés obligatoires de température lors du transport (cible entre 2°C et 6°C)."
          />
        );
      case "compta":
        // Rendu de l'archive comptable personnalisée pour les livreurs (Bons de livraison signés et relevés kilométriques)
        return <ArchiveComptabiliteLivreur />;
      case "dreal":
        return (
          <TabPlaceholder
            title="Conformité DREAL"
            description="Vérification de vos licences de transport et assurances de fret routier."
          />
        );
      case "profil":
      default:
        return <MonProfilContainer />; // Rendu dynamique de l'onglet Profil unifié
    }
  }

  // --- RENDU 4 : ONGLET ADMINISTRATEUR ---
  if (role === "admin") {
    switch (activeTab) {
      case "fiscal":
        // Rendu du centre de surveillance fiscale et télétransmission Chorus Pro pour l'Administrateur
        return <ArchiveComptabiliteAdmin />;
      case "haccp":
        return (
          <TabPlaceholder
            title="Centre d'Alertes Sanitaires"
            description="Surveillance en temps réel des ruptures de la chaîne du froid sur le réseau de livraison."
          />
        );
      case "moderation":
        return (
          <TabPlaceholder
            title="Modération du Catalogue"
            description="Validation des fiches produits, des prix et des labels de conformité de la marketplace."
          />
        );
      case "assistance":
      default:
        return (
          <TabPlaceholder
            title="Support & Assistance"
            description="Gestion des tickets d'assistance et support technique pour les utilisateurs connectés."
          />
        );
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-center py-20 text-gray-400 italic">
      Veuillez sélectionner un onglet valide dans la barre de navigation.
    </div>
  );
}

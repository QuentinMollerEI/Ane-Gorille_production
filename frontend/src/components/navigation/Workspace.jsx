import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Importations dynamiques des modules spécialisés par rôle
import ShopContainer from "../../pages/Boutique/ShopContainer.jsx";
import MiseEnRayon from "../../pages/MiseEnRayon/MiseEnRayon.jsx";
import OrderPreparation from "../../pages/Preparation/OrderPreparation.jsx";
import RoutePlanner from "../../pages/FeuilleDeRoute/RoutePlanner.jsx";
import OrderTracking from "../../pages/SuiviDesCommandes/OrderTracking.jsx";
import PiecesComptables from "../../pages/PiecesComptables/PiecesComptables.jsx";
import MonProfilContainer from "../../pages/MonProfil/MonProfilContainer.jsx";

/**
 * 🛡️ WORKSPACE.JSX : PARE-FEU FRONTEND RBAC
 * Aiguilleur strict adaptant les outils d'interface selon le rôle scellé dans le jeton.
 */
export default function Workspace() {
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const [currentModule, setCurrentModule] = useState("default");

  // Identification stricte du rôle via Custom Claims Firebase
  const role = userProfile?.role || user?.role || "acheteur_prive";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const module = params.get("module");
    if (module) setCurrentModule(module);
  }, [location.search]);

  // Routage étanche par rôle
  const renderAuthorizedModule = () => {
    switch (role) {
      case "producteur":
      case "producer":
      case "artisan": // Univers Âne (Terre) & Gorille (Main)
        if (currentModule === "prep") return <OrderPreparation />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <MiseEnRayon />; // Module par défaut

      case "livreur":
      case "carrier": // Logistique DREAL & HACCP
        if (currentModule === "profil") return <MonProfilContainer />;
        if (currentModule === "compta") return <PiecesComptables />;
        return <RoutePlanner />; // Module par défaut

      case "admin":
      case "administrator": // Tour de contrôle globale
        if (currentModule === "rayon") return <MiseEnRayon />;
        if (currentModule === "prep") return <OrderPreparation />;
        if (currentModule === "route") return <RoutePlanner />;
        if (currentModule === "suivi") return <OrderTracking />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <ShopContainer />;

      case "acheteur_public":
      case "client_public":
      case "acheteur_prive":
      case "client_pro":
      default: // Acheteurs B2B & B2G
        if (currentModule === "suivi") return <OrderTracking />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <ShopContainer />; // Catalogue & Panier
    }
  };

  return (
    <div className="w-full h-full animate-fade-in p-4 sm:p-6">
      {renderAuthorizedModule()}
    </div>
  );
}

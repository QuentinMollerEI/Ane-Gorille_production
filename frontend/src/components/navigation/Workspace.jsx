import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ShopContainer from "../../pages/Boutique/ShopContainer.jsx";
import MiseEnRayon from "../../pages/MiseEnRayon/MiseEnRayon.jsx";
import OrderPreparation from "../../pages/Preparation/OrderPreparation.jsx";
import RoutePlanner from "../../pages/FeuilleDeRoute/RoutePlanner.jsx";
import OrderTracking from "../../pages/SuiviDesCommandes/OrderTracking.jsx";
import PiecesComptables from "../../pages/PiecesComptables/PiecesComptables.jsx";
import MonProfilContainer from "../../pages/MonProfil/MonProfilContainer.jsx";

export default function Workspace() {
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const [currentModule, setCurrentModule] = useState("default");

  const role = userProfile?.role || user?.role || "acheteur_prive";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const module = params.get("module");
    if (module) setCurrentModule(module);
  }, [location.search]);

  // Moteur de Contrôle d'Accès Strict (RBAC)
  const renderAuthorizedModule = () => {
    switch (role) {
      // PRODUCTEURS / MARAÎCHERS
      case "producteur":
      case "producer":
      case "artisan":
        if (currentModule === "prep") return <OrderPreparation />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <MiseEnRayon />;

      // LIVREURS / LOGISTIQUE
      case "livreur":
      case "carrier":
        if (currentModule === "profil") return <MonProfilContainer />;
        return <RoutePlanner />;

      // ADMINISTRATEURS
      case "admin":
      case "administrator":
        if (currentModule === "rayon") return <MiseEnRayon />;
        if (currentModule === "prep") return <OrderPreparation />;
        if (currentModule === "route") return <RoutePlanner />;
        if (currentModule === "suivi") return <OrderTracking />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <ShopContainer />;

      // ACHETEURS PRIVÉS (B2B) ET PUBLICS (B2G)
      case "acheteur_public":
      case "client_public":
      case "acheteur_prive":
      case "client_pro":
      default:
        if (currentModule === "suivi") return <OrderTracking />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <ShopContainer />;
    }
  };

  return (
    <div className="w-full h-full animate-fade-in p-4 sm:p-6">
      {renderAuthorizedModule()}
    </div>
  );
}
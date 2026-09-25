import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
// ⚠️ CORRECTION : Le chemin remonte de deux niveaux depuis components/navigation/
import { useAuth } from "../../context/AuthContext";
import ShopContainer from "../../pages/Boutique/ShopContainer";
import MiseEnRayon from "../../pages/MiseEnRayon/MiseEnRayon";
import OrderPreparation from "../../pages/Preparation/OrderPreparation";
import RoutePlanner from "../../pages/FeuilleDeRoute/RoutePlanner";
import OrderTracking from "../../pages/SuiviDesCommandes/OrderTracking";
import PiecesComptables from "../../pages/PiecesComptables/PiecesComptables";
import MonProfilContainer from "../../pages/MonProfil/MonProfilContainer";

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

  const renderAuthorizedModule = () => {
    switch (role) {
      case "producteur":
      case "producer":
        if (currentModule === "prep") return <OrderPreparation />;
        if (currentModule === "compta") return <PiecesComptables />;
        if (currentModule === "profil") return <MonProfilContainer />;
        return <MiseEnRayon />;

      case "livreur":
      case "carrier":
        if (currentModule === "profil") return <MonProfilContainer />;
        return <RoutePlanner />;

      case "admin":
      case "administrator":
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
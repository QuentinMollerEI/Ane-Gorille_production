import React from "react";
import { useAuth } from "../../context/AuthContext";

// IMPORTS DES CONTENEURS SPÉCIFIQUES PAR RÔLE
import AcheteurPriveContainer from "./AcheteurPrive/AcheteurPriveContainer";
import AcheteurPublicContainer from "./AcheteurPublic/AcheteurPublicContainer";
import ProducteurContainer from "./Producteur/ProducteurContainer";
import LivreurContainer from "./Livreur/LivreurContainer";
import AdminContainer from "./Admin/AdminContainer";

/**
 * COMPOSANT : MonProfilContainer.jsx
 * Routeur dynamique de l'espace Profil (Clean Code & SRP).
 */
export default function MonProfilContainer() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  const role = user?.role || "acheteur_prive";

  // AIGUILLAGE VERS LE BON CONTENEUR SELON LE RÔLE
  switch (role) {
    case "acheteur_prive":
    case "client_pro":
    case "acheteur":
      return <AcheteurPriveContainer />;
    case "acheteur_public":
    case "client_public":
      return <AcheteurPublicContainer />;
    case "producteur":
    case "producer":
      return <ProducteurContainer />;
    case "livreur":
    case "carrier":
      return <LivreurContainer />;
    case "admin":
    case "administrator":
      return <AdminContainer />;
    default:
      return <AcheteurPriveContainer />;
  }
}
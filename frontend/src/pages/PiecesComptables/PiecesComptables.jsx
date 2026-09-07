import React from "react";
import { useAuth } from "../../context/AuthContext";
import PiecesComptablePublic from "./PiecesComptablePublic";
import PiecesComptablePrive from "./PiecesComptablePrive";

export default function PiecesComptables() {
  const { user } = useAuth();

  // Normalisation du rôle public pour le routage
  const isPublic =
    user?.role === "client_public" || user?.role === "acheteur_public";

  // Aiguillage transparent vers le bon composant métier
  return isPublic ? <PiecesComptablePublic /> : <PiecesComptablePrive />;
}

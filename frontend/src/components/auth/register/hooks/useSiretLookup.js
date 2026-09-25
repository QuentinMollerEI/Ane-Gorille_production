import { useState } from "react";

export function useSiretLookup() {
  const [siret, setSiret] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [error, setError] = useState("");

  const searchSiret = async (siretInput) => {
    const cleanSiret = (siretInput || siret).replace(/\s+/g, "");
    if (cleanSiret.length !== 14) {
      setError("Le numéro SIRET doit contenir exactement 14 chiffres.");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`);
      if (!response.ok) throw new Error("Impossible de contacter l'API PAPIER / SIRENE.");

      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error("Aucune entreprise trouvée pour ce numéro SIRET.");
      }

      const result = data.results[0];
      const extracted = {
        siret: cleanSiret,
        companyName: result.nom_complet || result.nom_raison_sociale || "Entreprise",
        address: result.siege?.adresse_complete || "Adresse non renseignée",
        isPublic: result.complements?.est_service_public || false
      };

      setCompanyInfo(extracted);
      return extracted;
    } catch (err) {
      setError(err.message || "Erreur de vérification du SIRET.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    siret,
    setSiret,
    loading,
    companyInfo,
    error,
    searchSiret
  };
}

export default useSiretLookup;
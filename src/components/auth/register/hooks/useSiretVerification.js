import { useState } from "react";
import { isValidLuhnSiret } from "../utils/geoUtils.js";

export function useSiretVerification({ setCompanyName, setAddress, setPostalCode, setCity, onSiretVerified }) {
  const [siret, setSiret] = useState("");
  const [verifyingSiret, setVerifyingSiret] = useState(false);
  const [siretVerified, setSiretVerified] = useState(false);

  const resetSiretStatus = () => {
    setSiretVerified(false);
  };

  const verifySiret = async (setError) => {
    const cleanSiret = siret.replace(/\s/g, "");
    setSiretVerified(false);
    setError("");

    if (!cleanSiret || cleanSiret.length !== 14) {
      setError("Le numéro SIRET doit comporter exactement 14 chiffres.");
      return;
    }

    if (!isValidLuhnSiret(cleanSiret)) {
      setError("Le numéro SIRET ne respecte pas la clé de contrôle officielle SIRENE.");
      return;
    }

    setVerifyingSiret(true);

    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`);
      if (!res.ok) throw new Error("Impossible de contacter l'API du répertoire national SIRENE.");

      const data = await res.json();
      const companyResult = data.results && data.results.length > 0 ? data.results[0] : null;

      if (!companyResult) {
        throw new Error("Numéro SIRET introuvable dans le répertoire national des entreprises.");
      }

      const nomRaison = companyResult.nom_complet || companyResult.nom_raison_sociale || "";
      const siege = companyResult.siege || {};
      const fullAddr = siege.adresse || "";
      const pCode = siege.code_postal || "";
      const commune = siege.libelle_commune || "";

      setCompanyName(nomRaison);
      if (fullAddr) setAddress(fullAddr);
      if (pCode) setPostalCode(pCode);
      if (commune) setCity(commune);

      setSiretVerified(true);

      if (fullAddr && pCode && commune && typeof onSiretVerified === "function") {
        await onSiretVerified(`${fullAddr}, ${pCode} ${commune}`);
      }
    } catch (err) {
      console.error("Erreur SIRET :", err);
      setError(err.message || "Échec de la validation SIRET.");
      setSiretVerified(false);
    } finally {
      setVerifyingSiret(false);
    }
  };

  return {
    siret,
    setSiret,
    verifyingSiret,
    siretVerified,
    verifySiret,
    resetSiretStatus
  };
}
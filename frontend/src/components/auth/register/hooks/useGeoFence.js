import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../../config/firebase.js";
import { calculateDistanceKm } from "../utils/geoUtils.js";
import { CENTRAL_LAT, CENTRAL_LON, MAX_RADIUS_KM } from "../constants.js";

export function useGeoFence() {
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [detectedDistance, setDetectedDistance] = useState(null);

  const resetLocationStatus = () => {
    setLocationVerified(false);
    setDetectedDistance(null);
  };

  const checkGeoDistance = async ({ address, postalCode, city, customQueryAddress = null, setError }) => {
    setLocationVerified(false);
    setDetectedDistance(null);
    if (setError) setError("");

    const queryAddr = customQueryAddress || `${address}, ${postalCode} ${city}`;
    if (!queryAddr || queryAddr.trim().length < 5) {
      if (setError) setError("Veuillez renseigner une adresse physique complète avec le code postal et la commune.");
      return;
    }

    setVerifyingLocation(true);

    try {
      try {
        const checkGeoFn = httpsCallable(functions, "checkGeoFenceServer");
        const cloudRes = await checkGeoFn({ address: queryAddr, postalCode, city });
        if (cloudRes.data && cloudRes.data.distanceKm !== undefined) {
          const dist = cloudRes.data.distanceKm;
          setDetectedDistance(dist);
          if (dist <= MAX_RADIUS_KM) {
            setLocationVerified(true);
            return;
          } else {
            setLocationVerified(false);
            if (setError) setError(`Accès refusé : Votre entreprise est située à ${dist} km de Saint-Rémy-sur-Avre (limite : ${MAX_RADIUS_KM} km).`);
            return;
          }
        }
      } catch (cloudErr) {
        console.warn("Bascule API Adresse gouvernementale directe :", cloudErr);
      }

      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(queryAddr)}&limit=1`
      );
      if (!res.ok) throw new Error("Service de géocodage indisponible.");

      const data = await res.json();
      const match = data.features && data.features.length > 0 ? data.features[0] : null;

      if (!match) {
        throw new Error("Adresse introuvable. Veuillez vérifier le libellé de la voie et de la commune.");
      }

      const [lon, lat] = match.geometry.coordinates;
      const distance = calculateDistanceKm(lat, lon, CENTRAL_LAT, CENTRAL_LON);

      setDetectedDistance(distance);

      if (distance > MAX_RADIUS_KM) {
        setLocationVerified(false);
        if (setError) setError(`Accès refusé : Votre établissement se situe à ${distance} km de Saint-Rémy-sur-Avre (28350). Les inscriptions sont strictement réservées au rayon de ${MAX_RADIUS_KM} km.`);
      } else {
        setLocationVerified(true);
      }
    } catch (err) {
      console.error("Erreur Géolocalisation :", err);
      if (setError) setError(err.message || "Échec de la vérification géographique.");
      setLocationVerified(false);
    } finally {
      setVerifyingLocation(false);
    }
  };

  return {
    verifyingLocation,
    locationVerified,
    detectedDistance,
    checkGeoDistance,
    resetLocationStatus
  };
}
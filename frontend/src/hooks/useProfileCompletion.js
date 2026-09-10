import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { profileService } from "../services/profile.service";

/**
 * 🪝 HOOK : useProfileCompletion.js
 * Responsabilité unique : Évaluation de l'état de complétude du profil utilisateur.
 */
export function useProfileCompletion() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [profileData, setProfileData] = useState(null);

  const checkStatus = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setIsProfileCompleted(false);
      setMissingFields([]);
      setProfileData(null);
      return;
    }

    try {
      setLoading(true);
      const profile = await profileService.getUserProfile(user.uid);

      if (profile) {
        setProfileData(profile);
        setIsProfileCompleted(!!profile.isProfileCompleted);
        setMissingFields(profile.missingFields || []);
      } else {
        setIsProfileCompleted(false);
        setMissingFields(["profile_not_found"]);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du profil :", error);
      setIsProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!authLoading) {
      checkStatus();
    }
  }, [authLoading, checkStatus]);

  return {
    loading: authLoading || loading,
    isProfileCompleted,
    missingFields,
    profileData,
    refetchProfile: checkStatus,
  };
}

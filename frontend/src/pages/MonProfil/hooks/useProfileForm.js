import { useState, useEffect } from "react";
import { db } from "../../../config/firebase.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext.jsx";

export function useProfileForm() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    companyName: "",
    siret: "",
    phone: "",
    address: "",
    iban: "",
    bic: "",
    role: "acheteur_prive"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfileData((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error("Erreur de chargement du profil :", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
    } catch (err) {
      console.error("Erreur de sauvegarde :", err);
      setMessage({ type: "error", text: err.message || "Erreur de sauvegarde." });
    } finally {
      setSaving(false);
    }
  };

  return {
    profileData,
    loading,
    saving,
    message,
    handleChange,
    handleSave
  };
}

export default useProfileForm;
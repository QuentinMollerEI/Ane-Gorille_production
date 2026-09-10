import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * 🛠️ SERVICE : profile.service.js
 * Responsabilité unique : Gestion de l'état de conformité et complétude des profils utilisateurs.
 */
export const profileService = {
  /**
   * 📋 MATRICE DE CONFORMITÉ : Définition des champs obligatoires par rôle
   */
  getRequiredFieldsByRole(role) {
    const baseFields = [
      "displayName",
      "companyName",
      "siret",
      "address",
      "zipCode",
      "city",
    ];

    switch (role) {
      case "acheteur_public":
      case "client_public":
        // Nécessite les infos de base pour l'engagement budgétaire & Chorus Pro
        return [...baseFields];

      case "producteur":
      case "producer":
        // Un producteur doit avoir renseigné ses infos d'exploitation
        return [...baseFields];

      case "livreur":
      case "carrier":
        return [...baseFields];

      case "acheteur_prive":
      case "client_pro":
      case "acheteur":
      default:
        return [...baseFields];
    }
  },

  /**
   * 🔍 Évaluation de la complétude du profil
   */
  checkProfileCompletion(data, role) {
    if (!data)
      return { isComplete: false, missingFields: ["profile_data_missing"] };

    const requiredFields = this.getRequiredFieldsByRole(role || data.role);
    const missingFields = requiredFields.filter((field) => {
      const val = data[field];
      return !val || (typeof val === "string" && val.trim() === "");
    });

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  },

  /**
   * 📥 Récupération du profil Firestore
   */
  async getUserProfile(uid) {
    if (!uid) throw new Error("UID utilisateur obligatoire.");
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return null;

    const data = snap.data();
    const { isComplete, missingFields } = this.checkProfileCompletion(
      data,
      data.role,
    );

    return {
      ...data,
      isProfileCompleted: isComplete,
      missingFields,
    };
  },

  /**
   * 💾 Sauvegarde du profil et calcul automatique de isProfileCompleted
   */
  async updateUserProfile(uid, updateData, role) {
    if (!uid) throw new Error("UID utilisateur obligatoire.");

    const userRef = doc(db, "users", uid);

    // 1. On récupère les données actuelles pour fusionner
    const currentSnap = await getDoc(userRef);
    const currentData = currentSnap.exists() ? currentSnap.data() : {};
    const mergedData = { ...currentData, ...updateData };

    // 2. Calcul du statut de complétude
    const { isComplete, missingFields } = this.checkProfileCompletion(
      mergedData,
      role || mergedData.role,
    );

    // 3. Écriture dans Firestore avec le flag isProfileCompleted
    const payload = {
      ...updateData,
      isProfileCompleted: isComplete,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, payload);

    return {
      success: true,
      isProfileCompleted: isComplete,
      missingFields,
    };
  },
};

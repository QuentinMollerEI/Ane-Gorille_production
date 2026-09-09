import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ShieldCheck,
  User,
  Crown,
  Lock,
  CheckCircle,
  RefreshCw,
  Sliders,
} from "lucide-react";

/**
 * 👑 COMPOSANT : AdminProfilContainer.jsx
 * Emplacement : src/pages/MonProfil/Admin/AdminProfilContainer.jsx
 *
 * Responsabilité unique : Fiche de compte personnelle de l'Administrateur (Coordonnées,
 * Clé d'urgence ADMIN2026 et paramètres système).
 * Ce composant est totallement DISSOCIÉ du tableau de modération (AdminContainer.jsx).
 */
export default function AdminProfilContainer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "Administrateur Système",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "Âne & Gorille SAS (Supervision)",
    adminKey: "ADMIN2026",
  });

  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfileData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            displayName: data.displayName || "Administrateur Système",
            email: data.email || user.email || "",
            phone: data.phone || "",
            companyName: data.companyName || "Âne & Gorille SAS (Supervision)",
            adminKey: "ADMIN2026",
          });
        }
      } catch (err) {
        console.error("Erreur de chargement du profil Admin :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user?.uid, user?.email]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          displayName: formData.displayName.trim(),
          phone: formData.phone.trim(),
          companyName: formData.companyName.trim(),
          updatedAt: new Date(),
        });
      }
      setSuccessMsg(
        "✅ Informations Administrateur mises à jour avec succès !",
      );
    } catch (err) {
      console.error("Erreur de sauvegarde du profil admin :", err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* HEADER DE PROFIL ADMIN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-900 rounded-2xl">
            <Crown size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Profil Administrateur Général
            </h2>
            <p className="text-xs text-gray-500 font-semibold">
              Identité de l'opérateur et droits de supervision de la plateforme
            </p>
          </div>
        </div>
        <span className="bg-purple-100 text-purple-900 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <Crown size={14} />
          Super Admin
        </span>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{successMsg}</span>
          <CheckCircle size={18} className="text-emerald-600" />
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* IDENTITÉ DU COMPTE */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2 text-xs">
            <User size={16} className="text-purple-700" />
            Coordonnées du Référent Administrateur
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Entité d'Exploitation Plateforme *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Nom & Prénom de l'Administrateur *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Adresse E-mail Administrateur (Identifiant)
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Téléphone Direct d'Urgence
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: 06 00 00 00 00"
              />
            </div>
          </div>
        </div>

        {/* PARAMÈTRES DE SÉCURITÉ ADMIN */}
        <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
          <h3 className="font-black text-purple-950 uppercase tracking-wider flex items-center gap-2">
            <Lock size={16} className="text-purple-700" />
            Clé d'Accès de Secours Administrateur
          </h3>
          <p className="text-purple-900 leading-relaxed">
            La clé <strong className="font-black">ADMIN2026</strong> permet le
            surpassement des règles RBAC lors de l'inscription pour attribuer
            immédiatement les privilèges de supervision.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          <span>Enregistrer les modifications Administrateur</span>
        </button>
      </form>
    </div>
  );
}

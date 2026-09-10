import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { profileService } from "../../../services/profile.service";
import {
  Building,
  MapPin,
  User,
  Mail,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function GeneralInfoForm({ onProfileUpdated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    displayName: "",
    companyName: "",
    siret: "",
    email: "",
    address: "",
    zipCode: "",
    city: "",
  });

  useEffect(() => {
    if (!user?.uid) return;
    async function loadData() {
      try {
        const data = await profileService.getUserProfile(user.uid);
        if (data) {
          setFormData({
            displayName: data.displayName || user.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            email: data.email || user.email || "",
            address: data.address || "",
            zipCode: data.zipCode || "",
            city: data.city || "",
          });
        }
      } catch (err) {
        console.error("Erreur chargement profil :", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setMessage(null);

    try {
      const result = await profileService.updateUserProfile(
        user.uid,
        formData,
        user.role,
      );
      setMessage({
        type: "success",
        text: "Informations enregistrées avec succès !",
      });
      if (onProfileUpdated) onProfileUpdated(result);
    } catch (err) {
      console.error("Erreur sauvegarde :", err);
      setMessage({
        type: "error",
        text: "Impossible de sauvegarder les modifications.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-gray-400 flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-emerald-700" />
        <span>Chargement des données établissement...</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 text-xs"
    >
      <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
        <Building className="text-emerald-700" size={18} />
        <span>Identité de l'Établissement & Référent</span>
      </h3>

      {message && (
        <div
          className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Nom & Prénom du Référent :
          </label>
          <input
            type="text"
            required
            value={formData.displayName}
            onChange={(e) =>
              setFormData({ ...formData, displayName: e.target.value })
            }
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Adresse E-mail Identifiante :
          </label>
          <div className="relative">
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-100 font-medium text-gray-500 cursor-not-allowed"
            />
            <Mail size={16} className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Raison Sociale / Établissement :
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">
            Numéro SIRET (14 chiffres) :
          </label>
          <input
            type="text"
            required
            value={formData.siret}
            onChange={(e) =>
              setFormData({ ...formData, siret: e.target.value })
            }
            className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="pt-2 border-t space-y-4">
        <h4 className="font-extrabold text-gray-800 text-xs flex items-center gap-1.5">
          <MapPin size={16} className="text-emerald-700" />
          <span>Adresse de Livraison & Facturation</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 space-y-1">
            <label className="font-bold text-gray-700">Rue / Lieu-dit :</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="font-bold text-gray-700">Code Postal :</label>
            <input
              type="text"
              required
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="font-bold text-gray-700">Commune :</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black py-3 px-6 rounded-2xl uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        <span>Enregistrer les données de l'établissement</span>
      </button>
    </form>
  );
}

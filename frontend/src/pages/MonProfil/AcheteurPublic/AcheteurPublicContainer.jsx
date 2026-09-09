import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  User,
  Building,
  MapPin,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  FileText,
} from "lucide-react";

/**
 * 🏛️ COMPOSANT : AcheteurPublicContainer.jsx
 * Responsabilité unique : Profil des Acheteurs Publics & Collectivités (Mairies, Cantines, Établissements).
 * Gère la configuration Chorus Pro (SIRET, Code Service, N° d'engagement par défaut) et l'adresse de livraison.
 */
export default function AcheteurPublicContainer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'chorus'

  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || user?.company || "",
    siret: user?.siret || "",
    codeService: user?.codeService || "",
    refEngagement: user?.refEngagement || user?.defaultEngagement || "",
    address: user?.address || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
  });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            displayName:
              data.displayName || data.name || user.displayName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            companyName: data.companyName || data.company || "",
            siret: data.siret || "",
            codeService: data.codeService || "",
            refEngagement: data.refEngagement || data.defaultEngagement || "",
            address: data.address || "",
            city: data.city || "",
            zipCode: data.zipCode || "",
          });
        }
      } catch (err) {
        console.error("Erreur de chargement profil Acheteur Public :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setSuccessMsg("");

    try {
      const userDocRef = doc(db, "users", user.uid);
      const payload = {
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        siret: formData.siret.trim(),
        codeService: formData.codeService.trim(),
        refEngagement: formData.refEngagement.trim(),
        defaultEngagement: formData.refEngagement.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        zipCode: formData.zipCode.trim(),
        updatedAt: new Date(),
      };

      await updateDoc(userDocRef, payload);
      setSuccessMsg(
        "✅ Informations enregistrées ! Votre panier utilisera automatiquement ces coordonnées Chorus Pro.",
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Erreur de sauvegarde :", err);
      alert("Erreur lors de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[250px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex border-b border-gray-200 space-x-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "identity"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <User size={16} />
          <span>1. Contact Référent</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chorus")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "chorus"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Building size={16} />
          <span>2. Facturation Chorus Pro & Adresse</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === "identity" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <User size={20} className="text-emerald-600" />
                Interlocuteur Référent Acheteur Public
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Nom & Prénom du Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Jean-Marc Bernard"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Téléphone Direct *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 05 61 22 22 22"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "chorus" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Building size={20} className="text-emerald-600" />
                Paramètres Chorus Pro & Adresse de Livraison
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Raison Sociale de l'Établissement Public *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Mairie de Toulouse (Cantine Centralisée)"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Numéro SIRET Établissement (14 chiffres) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.siret}
                  onChange={(e) =>
                    setFormData({ ...formData, siret: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 21310555400017"
                />
              </div>

              <div>
                <label className="block font-extrabold text-emerald-900 uppercase tracking-wider mb-1">
                  Code Service Chorus Pro (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.codeService}
                  onChange={(e) =>
                    setFormData({ ...formData, codeService: e.target.value })
                  }
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600"
                  placeholder="Ex: SERV-CANTINE"
                />
              </div>

              <div className="md:col-span-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <label className="block font-extrabold text-emerald-900 uppercase tracking-wider">
                  N° d'Engagement Budgétaire Général Par Défaut (Chorus Pro)
                </label>
                <input
                  type="text"
                  value={formData.refEngagement}
                  onChange={(e) =>
                    setFormData({ ...formData, refEngagement: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-600"
                  placeholder="Ex: ENG-2026-90812"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Adresse de Livraison de la Cantine / Dépôt *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 1 Place du Capitole"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Code Postal *
                </label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 31000"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Ville / Commune *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Toulouse"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2.5 disabled:opacity-50 active:scale-[0.99]"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Enregistrer le Profil Acheteur Public</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

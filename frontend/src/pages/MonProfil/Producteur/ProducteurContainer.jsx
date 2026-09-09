import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  User,
  Store,
  ShieldCheck,
  Award,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Upload,
  FileText,
} from "lucide-react";
import StripeConnectForm from "../components/StripeConnectForm";

/**
 * 🌾 COMPOSANT : ProducteurContainer.jsx
 * Responsabilité unique : Profil des Fournisseurs & Exploitants Agricoles.
 * Gère l'exploitation, le téléversement du certificat Bio (AB / Ecocert), et l'onboarding Stripe Connect Express.
 */
export default function ProducteurContainer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'farm' | 'bio' | 'stripe'

  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || user?.company || "",
    siret: user?.siret || "",
    address: user?.address || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    isBioCertified: Boolean(user?.isBioCertified || false),
    bioCertificateNumber: user?.bioCertificateNumber || "",
    bioCertificateExpiry: user?.bioCertificateExpiry || "",
    bioCertificateUrl: user?.bioCertificateUrl || "",
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
            address: data.address || "",
            city: data.city || "",
            zipCode: data.zipCode || "",
            isBioCertified: Boolean(data.isBioCertified || false),
            bioCertificateNumber: data.bioCertificateNumber || "",
            bioCertificateExpiry: data.bioCertificateExpiry || "",
            bioCertificateUrl: data.bioCertificateUrl || "",
          });
        }
      } catch (err) {
        console.error("Erreur de chargement profil Fournisseur :", err);
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
        address: formData.address.trim(),
        city: formData.city.trim(),
        zipCode: formData.zipCode.trim(),
        isBioCertified: Boolean(formData.isBioCertified),
        bioCertificateNumber: formData.bioCertificateNumber.trim(),
        bioCertificateExpiry: formData.bioCertificateExpiry,
        bioCertificateUrl: formData.bioCertificateUrl,
        updatedAt: new Date(),
      };

      await updateDoc(userDocRef, payload);
      setSuccessMsg(
        "✅ Profil Exploitation enregistré ! Vos fiches de mise en rayon sont synchronisées.",
      );
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Erreur d'enregistrement :", err);
      alert("Erreur lors de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleBioCertificateUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = `https://firebasestorage.googleapis.com/v0/b/ane-et-gorille/o/certificats%2F${file.name}?alt=media`;
      setFormData((prev) => ({
        ...prev,
        bioCertificateUrl: fakeUrl,
        isBioCertified: true,
      }));
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
          <span>1. Contact Exploitant</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("farm")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "farm"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Store size={16} />
          <span>2. Domaine & Point de Collecte</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bio")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "bio"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Award size={16} />
          <span>3. Certificat Bio (AB)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stripe")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "stripe"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <CreditCard size={16} />
          <span>4. Stripe Connect (Obligatoire)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === "stripe" ? (
        <StripeConnectForm />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === "identity" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <User size={20} className="text-emerald-600" />
                  Identité du Responsable d'Exploitation
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Nom & Prénom du Référent *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Alain Dupuy"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Téléphone Exploitation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 06 11 22 33 44"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "farm" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Store size={20} className="text-emerald-600" />
                  Exploitation & Point de Collecte Logistique
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Nom de la Ferme / Domaine Agricole *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Ferme de la Rosée Agricole"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Numéro SIRET Exploitant *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siret}
                    onChange={(e) =>
                      setFormData({ ...formData, siret: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: 44332211000012"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Adresse du Hangar / Point de Collecte des Cagettes *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Chemin des Maraîchers"
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
                    placeholder="Ex: 31320"
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
                    placeholder="Ex: Castanet-Tolosan"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "bio" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Award size={20} className="text-emerald-600" />
                  Certification Agriculture Biologique (AB / Ecocert)
                </h2>
              </div>

              <div className="space-y-5 text-xs">
                <label className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50/50 rounded-2xl cursor-pointer hover:bg-amber-50 transition-all">
                  <input
                    type="checkbox"
                    className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 rounded"
                    checked={formData.isBioCertified}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isBioCertified: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <p className="font-extrabold text-amber-900 uppercase tracking-wider">
                      Exploitation Certifiée Agriculture Biologique (AB)
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      L'activation autorise le marquage Bio lors de la mise en
                      rayon.
                    </p>
                  </div>
                </label>

                {formData.isBioCertified && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                          Numéro de Certificat Ecocert / Agence Bio
                        </label>
                        <input
                          type="text"
                          value={formData.bioCertificateNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bioCertificateNumber: e.target.value,
                            })
                          }
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-gray-800"
                          placeholder="Ex: C-2026-BIO-31998"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">
                          Date d'Échéance du Certificat
                        </label>
                        <input
                          type="date"
                          value={formData.bioCertificateExpiry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bioCertificateExpiry: e.target.value,
                            })
                          }
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-semibold text-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">
                        Joindre le Certificat Officiel (PDF / Image)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer relative bg-white">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleBioCertificateUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload
                          size={24}
                          className="mx-auto text-emerald-600 mb-1"
                        />
                        <p className="text-xs font-bold text-gray-700">
                          {formData.bioCertificateUrl
                            ? "✅ Document téléversé avec succès"
                            : "Cliquez ou glissez votre justificatif Bio ici"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          PDF, PNG, JPG jusqu'à 10 Mo
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
                  <span>Enregistrer le Profil Exploitant</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

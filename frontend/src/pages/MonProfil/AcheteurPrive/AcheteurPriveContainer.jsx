import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  User,
  Building,
  CreditCard,
  MapPin,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  FileText,
} from "lucide-react";

/**
 * 🏢 COMPOSANT : AcheteurPriveContainer.jsx
 * Responsabilité unique : Profil des Acheteurs Professionnels B2B (Restaurants, Traiteurs, Commerces).
 * Gère la raison sociale, l'adresse de livraison des caisses consignées, et le mandat SEPA Direct Debit.
 */
export default function AcheteurPriveContainer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'pro' | 'sepa'

  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || user?.company || "",
    siret: user?.siret || "",
    address: user?.address || "",
    city: user?.city || "",
    zipCode: user?.zipCode || "",
    paymentPreference: user?.paymentPreference || "stripe", // 'stripe' | 'sepa_b2b'
    iban: user?.iban || "",
    bic: user?.bic || "",
    sepaMandateAccepted: Boolean(user?.sepaMandateAccepted || false),
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
            paymentPreference: data.paymentPreference || "stripe",
            iban: data.iban || "",
            bic: data.bic || "",
            sepaMandateAccepted: Boolean(data.sepaMandateAccepted || false),
          });
        }
      } catch (err) {
        console.error(
          "Erreur de chargement profil Acheteur Professionnel :",
          err,
        );
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
        paymentPreference: formData.paymentPreference,
        iban: formData.iban.trim(),
        bic: formData.bic.trim(),
        sepaMandateAccepted: Boolean(formData.sepaMandateAccepted),
        updatedAt: new Date(),
      };

      await updateDoc(userDocRef, payload);
      setSuccessMsg(
        "✅ Informations enregistrées ! Votre panier utilisera automatiquement ces coordonnées.",
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
          <span>1. Contact & Référent</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pro")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "pro"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Building size={16} />
          <span>2. Raison Sociale & Livraison</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sepa")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === "sepa"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <CreditCard size={16} />
          <span>3. Mandat SEPA & Paiement B2B</span>
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
                Contact Référent Acheteur Professionnel
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Nom d'affichage / Prénom Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Sophie Martin"
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
                  placeholder="Ex: 06 98 76 54 32"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "pro" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Building size={20} className="text-emerald-600" />
                Établissement & Adresse de Livraison
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Raison Sociale / Nom du Commerce *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Bistrot du Marché SARL"
                />
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Numéro SIRET (14 chiffres) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.siret}
                  onChange={(e) =>
                    setFormData({ ...formData, siret: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 80234567800023"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                  Adresse de Livraison (Point de dépôt des cagettes consignées)
                  *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 14 Rue Alsace-Lorraine"
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

        {activeTab === "sepa" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <CreditCard size={20} className="text-emerald-600" />
                Moyen de Règlement & Mandat SEPA Direct Debit (30j/60j)
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 uppercase tracking-wider mb-2">
                  Mode de Règlement Préféré
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      formData.paymentPreference === "stripe"
                        ? "border-emerald-600 bg-emerald-50/50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPreference"
                      value="stripe"
                      checked={formData.paymentPreference === "stripe"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPreference: e.target.value,
                        })
                      }
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-extrabold text-gray-900">
                        Carte Bancaire (Immédiat)
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Règlement instantané sécurisé Stripe.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      formData.paymentPreference === "sepa_b2b"
                        ? "border-emerald-600 bg-emerald-50/50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPreference"
                      value="sepa_b2b"
                      checked={formData.paymentPreference === "sepa_b2b"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPreference: e.target.value,
                        })
                      }
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-extrabold text-gray-900">
                        Prélèvement SEPA B2B (Différé LME)
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Paiement sur facture à 30 jours (produits frais).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.paymentPreference === "sepa_b2b" && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
                  <p className="font-bold text-emerald-900 uppercase">
                    Configuration du Mandat SEPA Direct Debit
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">
                        IBAN de l'Entreprise *
                      </label>
                      <input
                        type="text"
                        value={formData.iban}
                        onChange={(e) =>
                          setFormData({ ...formData, iban: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs uppercase"
                        placeholder="FR76 3000 1007 9412 3456 7890 189"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Code BIC / SWIFT *
                      </label>
                      <input
                        type="text"
                        value={formData.bic}
                        onChange={(e) =>
                          setFormData({ ...formData, bic: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs uppercase"
                        placeholder="BNPAFRPPXXX"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 text-emerald-600 rounded"
                      checked={formData.sepaMandateAccepted}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sepaMandateAccepted: e.target.checked,
                        })
                      }
                    />
                    <span className="text-[11px] text-emerald-800 font-medium leading-tight">
                      J'autorise Âne & Gorille et son prestataire agréé à
                      émettre des ordres de prélèvement SEPA B2B sur le compte
                      bancaire ci-dessus aux dates d'échéance des commandes
                      d'alimentation fraîche.
                    </span>
                  </label>
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
                <span>Enregistrer le Profil Acheteur Pro</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

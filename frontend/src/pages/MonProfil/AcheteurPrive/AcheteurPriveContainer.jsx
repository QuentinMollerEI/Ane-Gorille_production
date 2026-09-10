import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { initSepaSetupIntent } from "../../../services/paymentService";
import SepaMandateModal from "../../../components/payments/SepaMandateModal";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
} from "lucide-react";

/**
 * 🔒 COMPOSANT : AcheteurPriveContainer.jsx
 * Emplacement : src/pages/MonProfil/AcheteurPrive/AcheteurPriveContainer.jsx
 * Responsabilité : Gestion du profil B2B/B2C, coordonnées de facturation et Mandat SEPA Stripe.
 */
export default function AcheteurPriveContainer() {
  const { user } = useAuth();

  // États du profil et chargement
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // États de configuration du Mandat SEPA
  const [loadingSepa, setLoadingSepa] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [mandateSuccess, setMandateSuccess] = useState(false);

  // Données du formulaire
  const [profileData, setProfileData] = useState({
    displayName: "",
    companyName: "",
    siret: "",
    phone: "",
    email: "",
    postalCode: "",
    city: "",
    address: "",
    preferredPayment: "stripe_sepa",
  });

  // Charger le profil Firestore au chargement du composant
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchUserProfile() {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData({
            displayName: data.displayName || user.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            postalCode: data.postalCode || "",
            city: data.city || "",
            address: data.address || "",
            preferredPayment: data.preferredPayment || "stripe_sepa",
          });

          if (data.sepaMandateActive) {
            setMandateSuccess(true);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Enregistrer les modifications du profil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSubmitting(true);
    setIsSaved(false);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        companyName: profileData.companyName,
        siret: profileData.siret,
        phone: profileData.phone,
        postalCode: profileData.postalCode,
        city: profileData.city,
        address: profileData.address,
        preferredPayment: profileData.preferredPayment,
        updatedAt: new Date().toISOString(),
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du profil :", error);
      alert("Erreur lors de la sauvegarde de votre profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialiser la session de mandat SEPA
  const handleStartSepaSetup = async () => {
    setLoadingSepa(true);
    try {
      const result = await initSepaSetupIntent();
      if (result && result.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        alert("Impossible de démarrer l'initialisation du mandat SEPA.");
      }
    } catch (error) {
      console.error("[SEPA SETUP ERROR] :", error);
      alert(error.message || "Erreur lors de l'initialisation du mandat SEPA.");
    } finally {
      setLoadingSepa(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-emerald-700" size={32} />
        <span className="ml-3 text-xs font-bold text-gray-600">
          Chargement de vos informations de profil...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs animate-fade-in pb-12">
      {/* EN-TÊTE DU PROFIL */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Espace Acheteur Privé (B2B / Restaurateur)
          </h2>
          <p className="text-gray-500 font-medium mt-1">
            Gérez votre raison sociale, vos coordonnées de livraison et votre
            mode de règlement.
          </p>
        </div>
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
          <Building2 size={24} />
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>
            Vos informations professionnelles ont été mises à jour avec succès.
          </span>
        </div>
      )}

      {/* FORMULAIRE PRINCIPAL DE PROFIL */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* COMPARTIMENT 1 : IDENTITÉ & SOCIÉTÉ */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
            <User size={16} className="text-emerald-700" />
            1. Informations Générales & Société
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Responsable du compte *
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="displayName"
                  required
                  value={profileData.displayName}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Raison Sociale / Enseigne *
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="companyName"
                  required
                  value={profileData.companyName}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Numéro SIRET (14 chiffres) *
              </label>
              <input
                type="text"
                name="siret"
                required
                maxLength={14}
                value={profileData.siret}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Téléphone Direct *
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={profileData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                Adresse E-mail de Facturation
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="email"
                  name="email"
                  disabled
                  value={profileData.email}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COMPARTIMENT 2 : ADRESSE DE LIVRAISON */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
            <MapPin size={16} className="text-emerald-700" />
            2. Adresse de Livraison Préférée
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                Adresse Civique *
              </label>
              <input
                type="text"
                name="address"
                required
                value={profileData.address}
                onChange={handleChange}
                placeholder="15 Rue de la République"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Code Postal *
              </label>
              <input
                type="text"
                name="postalCode"
                required
                value={profileData.postalCode}
                onChange={handleChange}
                placeholder="28380"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                name="city"
                required
                value={profileData.city}
                onChange={handleChange}
                placeholder="Saint-Rémy-sur-Avre"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* BOUTON ENREGISTRER DANS LE FORMULAIRE */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-2xl uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Mettre à jour mon profil</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* COMPARTIMENT 3 : PRÉLÈVEMENT AUTOMATIQUE SEPA B2B */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
          <CreditCard size={16} className="text-emerald-700" />
          3. Prélèvement Automatique SEPA B2B (Stripe Connect)
        </h3>

        <p className="text-gray-500 leading-relaxed">
          Configurez votre mandat de prélèvement SEPA sécurisé pour régler
          automatiquement vos commandes auprès des producteurs en circuit court.
        </p>

        {mandateSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-extrabold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <span>Mandat SEPA configuré et actif pour votre compte.</span>
            </div>
            <button
              type="button"
              onClick={handleStartSepaSetup}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Mettre à jour l'IBAN
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-emerald-950">
                Aucun Mandat SEPA actif
              </p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Signez électroniquement votre mandat pour débloquer le règlement
                différé B2B.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartSepaSetup}
              disabled={loadingSepa}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:bg-gray-300"
            >
              {loadingSepa ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Initialisation...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Configurer le Mandat SEPA</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MODAL STRIPE ELEMENTS (SIGNATURE IBAN SEPA) */}
      {clientSecret && (
        <SepaMandateModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
          onSuccess={async () => {
            setClientSecret(null);
            setMandateSuccess(true);
            if (user?.uid) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                sepaMandateActive: true,
                updatedAt: new Date().toISOString(),
              });
            }
          }}
        />
      )}
    </div>
  );
}

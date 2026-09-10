import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  User,
  Building,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  CreditCard,
  ExternalLink,
} from "lucide-react";

/**
 * 👤 COMPOSANT : MonProfilContainer.jsx
 * Profil unifié B2B / B2G / Producteur / Livreur / Admin
 * Intègre la gestion directe de Stripe Connect sans dépendances externes.
 */
export default function MonProfilContainer() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [stripeError, setStripeError] = useState(null);

  // État local du formulaire de profil
  const [profileData, setProfileData] = useState({
    displayName: "",
    companyName: "",
    siret: "",
    codeService: "",
    email: "",
    address: "",
    zipCode: "",
    city: "",
    role: "acheteur_prive",
    stripeAccountId: null,
  });

  // Normalisation du rôle
  const rawRole = user?.role || "acheteur_prive";
  const isPublicBuyer =
    rawRole === "acheteur_public" || rawRole === "client_public";
  const isProducer = rawRole === "producteur";

  // Charger les données Firestore de l'utilisateur
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData({
            displayName: data.displayName || user.displayName || "",
            companyName: data.companyName || "",
            siret: data.siret || "",
            codeService: data.codeService || "",
            email: data.email || user.email || "",
            address: data.address || "",
            zipCode: data.zipCode || "",
            city: data.city || "",
            role: data.role || rawRole,
            stripeAccountId: data.stripeAccountId || null,
          });
        }
      } catch (err) {
        console.error("Erreur chargement profil :", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user?.uid, rawRole]);

  // Sauvegarde des modifications dans Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setMessage(null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        companyName: profileData.companyName,
        siret: profileData.siret,
        codeService: profileData.codeService,
        address: profileData.address,
        zipCode: profileData.zipCode,
        city: profileData.city,
        updatedAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error("Erreur sauvegarde profil :", err);
      setMessage({
        type: "error",
        text: "Impossible de sauvegarder le profil.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Déclenchement de l'onboarding Stripe Connect (Producteur)
  const handleStripeConnect = async () => {
    if (!user?.uid) return;

    setStripeLoading(true);
    setStripeError(null);

    try {
      const functions = getFunctions(auth?.app, "europe-west9");
      const createAccountFn = httpsCallable(
        functions,
        "createStripeConnectAccountServer",
      );
      const res = await createAccountFn({ producerId: user.uid });

      if (res.data?.success && res.data?.onboardingUrl) {
        window.location.href = res.data.onboardingUrl;
      } else {
        throw new Error(
          res.data?.error ||
            "Impossible de récupérer l'URL d'onboarding Stripe.",
        );
      }
    } catch (err) {
      console.error("Échec Stripe Connect :", err);
      setStripeError(err.message || "Erreur lors de la connexion à Stripe.");
    } finally {
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-700" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Chargement de votre profil...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 text-xs animate-fade-in">
      {/* EN-TÊTE DU PROFIL */}
      <div className="border-b border-gray-150 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <User className="text-emerald-700" size={22} />
            <span>Espace Profil & Paramètres</span>
          </h2>
          <p className="text-gray-500 font-semibold mt-0.5">
            {isPublicBuyer
              ? "Acheteur Public (B2G / Chorus Pro & Mandats Administratifs)"
              : isProducer
                ? "Compte Producteur (Gestion Exploitation & Stripe Connect)"
                : "Acheteur Privé (B2B / Restauration & Entreprises)"}
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase rounded-full border border-emerald-200">
          Rôle : {profileData.role}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl font-bold flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <AlertTriangle size={18} className="shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* COMPARTIMENT 1 : IDENTITÉ & RÉFÉRENT */}
        <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <User size={16} className="text-emerald-700" />
            <span>1. Référent & Identifiants</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Nom & Prénom du Référent :
              </label>
              <input
                type="text"
                required
                value={profileData.displayName}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    displayName: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
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
                  value={profileData.email}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-100 font-medium text-gray-500 cursor-not-allowed"
                />
                <Mail
                  size={16}
                  className="absolute right-3 top-3 text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COMPARTIMENT 2 : INFORMATIONS ÉTABLISSEMENT */}
        <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Building size={16} className="text-emerald-700" />
            <span>2. Informations Établissement & Facturation</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Raison Sociale / Établissement :
              </label>
              <input
                type="text"
                required
                value={profileData.companyName}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    companyName: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Numéro SIRET (14 chiffres) :
              </label>
              <input
                type="text"
                required
                value={profileData.siret}
                onChange={(e) =>
                  setProfileData({ ...profileData, siret: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono"
              />
            </div>

            {isPublicBuyer && (
              <div className="space-y-1 sm:col-span-2 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                <label className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-700" />
                  Code Service Chorus Pro (Optionnel pour collectivités) :
                </label>
                <input
                  type="text"
                  placeholder="ex: SERV-CANTINE"
                  value={profileData.codeService}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      codeService: e.target.value,
                    })
                  }
                  className="w-full p-2.5 border border-blue-300 rounded-xl bg-white font-mono text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* COMPARTIMENT 3 : ADRESSE DE LIVRAISON */}
        <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <MapPin size={16} className="text-emerald-700" />
            <span>3. Adresse de Livraison & Geo-Fencing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1">
              <label className="font-bold text-gray-700">
                Rue / Lieu-dit :
              </label>
              <input
                type="text"
                required
                value={profileData.address}
                onChange={(e) =>
                  setProfileData({ ...profileData, address: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Code Postal :</label>
              <input
                type="text"
                required
                value={profileData.zipCode}
                onChange={(e) =>
                  setProfileData({ ...profileData, zipCode: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Commune :</label>
              <input
                type="text"
                required
                value={profileData.city}
                onChange={(e) =>
                  setProfileData({ ...profileData, city: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* BOUTON DE SAUVEGARDE */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black py-3.5 px-6 rounded-2xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enregistrement des modifications...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Enregistrer mon Profil</span>
            </>
          )}
        </button>
      </form>

      {/* COMPARTIMENT STRIPE CONNECT (PRODUCTEUR UNIQUEMENT) */}
      {isProducer && (
        <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-3 pt-4">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
            <CreditCard className="text-emerald-700 shrink-0" size={20} />
            <div>
              <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                Compte de Reversement Stripe Connect
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Recevez vos ventes directement sur votre compte bancaire
                d'exploitation.
              </p>
            </div>
          </div>

          {stripeError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{stripeError}</span>
            </div>
          )}

          {profileData.stripeAccountId ? (
            <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                <span>
                  Compte Stripe actif :{" "}
                  <span className="font-mono text-emerald-900">
                    {profileData.stripeAccountId}
                  </span>
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-md">
                CONFIGURÉ
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={stripeLoading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {stripeLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Génération du lien Stripe...</span>
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  <span>Lier mon compte d'exploitation à Stripe Connect</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

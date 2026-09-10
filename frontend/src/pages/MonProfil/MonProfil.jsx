import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../../config/firebase";
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building,
  User,
  FileText,
  Lock,
} from "lucide-react";

/**
 * 👤 COMPOSANT : MonProfil.jsx
 * Onglet Profil Utilisateur avec Mise à Jour Certifiée de l'Adresse & Geo-Fencing.
 */
export default function MonProfil() {
  const { user, userProfile } = useAuth();

  // Initialisation sécurisée de Firebase Functions sur la région europe-west9 (Paris)
  const functions = getFunctions(auth?.app, "europe-west9");

  // Données de profil
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");

  // États du Geo-Fencing
  const [geoStatus, setGeoStatus] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setAddress(userProfile.address || userProfile.adresse || "");
      setZipCode(userProfile.zipCode || userProfile.codePostal || "");
      setCity(userProfile.city || userProfile.ville || "");
      setCompanyName(
        userProfile.companyName || userProfile.raisonSociale || "",
      );
      setSiret(userProfile.siret || userProfile.numSiret || "");

      if (userProfile.isGeoEligible !== undefined) {
        setGeoStatus({
          eligible: userProfile.isGeoEligible,
          distanceKm: userProfile.hubDistanceKm || 0,
          maxAllowedKm: userProfile.role === "producteur" ? 30 : 50,
          message: userProfile.isGeoEligible
            ? `Adresse certifiée (${userProfile.hubDistanceKm || 0} km du Hub)`
            : "Adresse hors zone kilométrique du Hub.",
        });
      }
    }
  }, [userProfile]);

  const handleUpdateAddressAndGeo = async (e) => {
    e.preventDefault();
    if (!address.trim() || !city.trim()) {
      setError("Veuillez remplir votre adresse et votre commune.");
      return;
    }

    setLoadingGeo(true);
    setError(null);
    setMessage(null);

    try {
      const validateGeoFn = httpsCallable(
        functions,
        "validateAddressAndGeoFence",
      );
      const res = await validateGeoFn({
        address,
        zipCode,
        city,
        role: userProfile?.role || "acheteur_prive",
      });

      setGeoStatus(res.data);
      if (res.data.eligible) {
        setMessage("✅ Adresse certifiée et enregistrée avec succès !");
      } else {
        setError(`⚠️ Adresse hors périmètre : ${res.data.message}`);
      }
    } catch (err) {
      console.error("Erreur mise à jour Geo-Fence :", err);
      setError(err.message || "Erreur lors de la validation géographique.");
    } finally {
      setLoadingGeo(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in text-xs">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <User size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Mon Profil & Paramètres
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Gestion de votre entité juridique et certification géographique de
              livraison
            </p>
          </div>
        </div>

        <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-black px-3.5 py-1.5 rounded-full text-[11px] uppercase">
          Rôle : {userProfile?.role || "Utilisateur"}
        </span>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpdateAddressAndGeo} className="space-y-6">
        {/* BLOC 1 : LOCALISATION & CERTIFICATION HUB */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-150 pb-3">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700" />
              <span>Adresse Certifiée de Livraison / Exploitation</span>
            </h2>

            {geoStatus && (
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                  geoStatus.eligible
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-900"
                }`}
              >
                {geoStatus.eligible ? (
                  <ShieldCheck size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                <span>
                  {geoStatus.eligible ? "Certifiée Hub" : "Non Éligible"}
                </span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6 space-y-1">
              <label className="font-bold text-gray-700">
                Rue / Adresse complète :
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Code Postal :</label>
              <input
                type="text"
                required
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Commune :</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-extrabold text-gray-900">
                Hub Central de Rattachement : Saint-Rémy-sur-Avre
              </p>
              <p className="text-gray-500 text-[11px]">
                {geoStatus?.distanceKm
                  ? `Distance actuelle : ${geoStatus.distanceKm} km (Périmètre maximal : ${geoStatus.maxAllowedKm} km)`
                  : "Saisissez votre adresse pour calculer la distance exacte au Hub."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loadingGeo}
              className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              {loadingGeo
                ? "Certification en cours..."
                : "Enregistrer et Certifier l'Adresse"}
            </button>
          </div>
        </div>

        {/* BLOC 2 : IDENTIFIANTS JURIDIQUES ET FACTURATION */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-150 pb-3">
            <Building size={18} className="text-blue-700" />
            <span>Identifiants Légaux & Facturation</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Raison Sociale / Nom d'Établissement :
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Numéro SIRET (14 chiffres) :
              </label>
              <input
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

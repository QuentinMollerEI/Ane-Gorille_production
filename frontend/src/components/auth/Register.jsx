import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
// 🎯 Depuis src/components/auth/Register.jsx, on remonte de 2 niveaux ( ../../ )
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../config/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/**
 * 📝 COMPOSANT : Register.jsx
 * Inscription B2B / B2G / Producteur avec Validation Geo-Fencing V2 (europe-west9).
 */
export default function Register({ onNavigateToLogin, onRegisterSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const functions = getFunctions(auth?.app, "europe-west9");

  // 🛡️ Redirection si déjà connecté
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Étape 1 : Formulaire d'identité
  const [role, setRole] = useState("acheteur_prive");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Étape 2 : Adresse & Geo-Fencing
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");

  // États du contrôle géographique
  const [geoStatus, setGeoStatus] = useState(null);
  const [checkingGeo, setCheckingGeo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Validation Géographique en Direct via Cloud Function V2 (europe-west9)
  const handleVerifyGeoFence = async () => {
    if (!address.trim() || !city.trim()) {
      setError(
        "Veuillez renseigner au moins votre rue et votre commune pour tester l'éligibilité.",
      );
      return;
    }

    setCheckingGeo(true);
    setError(null);
    setGeoStatus(null);

    try {
      const validateGeoFn = httpsCallable(
        functions,
        "validateAddressAndGeoFence",
      );
      const res = await validateGeoFn({
        address,
        zipCode,
        city,
        role,
      });

      setGeoStatus(res.data);
    } catch (err) {
      console.error("Erreur test Geo-Fence :", err);
      setError(
        err.message ||
          "Erreur lors de la vérification géographique de l'adresse.",
      );
    } finally {
      setCheckingGeo(false);
    }
  };

  // Enregistrement Auth + Firestore + Redirection vers Dashboard
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!geoStatus || !geoStatus.eligible) {
      setError(
        "Votre adresse doit être testée et certifiée dans le périmètre du Hub (Saint-Rémy-sur-Avre) avant de valider l'inscription.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Création du compte Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCred.user.uid;

      // 2. Écriture du document utilisateur dans Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        displayName,
        companyName,
        siret,
        email,
        role,
        address,
        zipCode,
        city,
        isGeoEligible: geoStatus.eligible,
        hubDistanceKm: geoStatus.distanceKm,
        maxAllowedKm: role === "producteur" ? 30 : 50,
        createdAt: serverTimestamp(),
      });

      // 3. Navigation vers le Dashboard
      if (onRegisterSuccess) {
        onRegisterSuccess(userCred.user);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Erreur Inscription :", err);
      setError(err.message || "Impossible de finaliser l'inscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 text-xs">
      <div className="border-b border-gray-150 pb-4 text-center space-y-1">
        <h2 className="text-xl font-black text-gray-900">
          Création de Compte Professionnel
        </h2>
        <p className="text-gray-500 font-semibold">
          Circuit court agricole sécurisé autour du Hub de Saint-Rémy-sur-Avre
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CHOIX DU RÔLE */}
        <div className="space-y-2">
          <label className="block font-black uppercase text-gray-700 tracking-wider">
            Sélectionnez votre Rôle :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole("acheteur_prive");
                setGeoStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                role === "acheteur_prive"
                  ? "bg-emerald-50 border-emerald-700 text-emerald-900 shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="font-extrabold text-sm mb-0.5">
                🏢 Acheteur Privé
              </div>
              <div className="text-[10px] text-gray-500 font-normal">
                Cantine privée, Restaurant, Épicerie (Rayon 50 km)
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("acheteur_public");
                setGeoStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                role === "acheteur_public"
                  ? "bg-blue-50 border-blue-700 text-blue-900 shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="font-extrabold text-sm mb-0.5">
                🏛️ Acheteur Public
              </div>
              <div className="text-[10px] text-gray-500 font-normal">
                Collectivité, Restauration scolaire (Chorus Pro, Rayon 50 km)
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("producteur");
                setGeoStatus(null);
              }}
              className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                role === "producteur"
                  ? "bg-amber-50 border-amber-700 text-amber-900 shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="font-extrabold text-sm mb-0.5">🧑‍🌾 Producteur</div>
              <div className="text-[10px] text-gray-500 font-normal">
                Maraîcher local, Exploitation agricole (Rayon 30 km)
              </div>
            </button>
          </div>
        </div>

        {/* INFORMATIONS COMPTE & ENTITÉ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-gray-700">
              Nom & Prénom du Référent :
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ex: Jean Dupont"
              className="w-full p-3 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">
              Nom de la Ferme / Établissement :
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ex: Ferme des 3 Chênes"
              className="w-full p-3 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">Numéro SIRET :</label>
            <input
              type="text"
              required
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              placeholder="14 chiffres sans espace"
              className="w-full p-3 border border-gray-300 rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700">
              Adresse E-mail Identifiant :
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@exemple.fr"
              className="w-full p-3 border border-gray-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-700">Mot de Passe :</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-3 border border-gray-300 rounded-xl font-medium"
          />
        </div>

        {/* SECTION LOCALISATION & VERIFICATION GEO-FENCE */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h3 className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <MapPin size={16} className="text-emerald-700" />
              <span>Géolocalisation & Rayon de Livraison</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              Hub : Saint-Rémy-sur-Avre (Max :{" "}
              {role === "producteur" ? "30 km" : "50 km"})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1">
              <label className="font-bold text-gray-700">
                Rue / Lieu-dit :
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setGeoStatus(null);
                }}
                placeholder="12 rue de la Mairie"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Code Postal :</label>
              <input
                type="text"
                required
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value);
                  setGeoStatus(null);
                }}
                placeholder="28380"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-gray-700">Commune :</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setGeoStatus(null);
                }}
                placeholder="Saint-Rémy"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleVerifyGeoFence}
              disabled={checkingGeo || !address.trim() || !city.trim()}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-xl uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ShieldCheck size={16} />
              <span>
                {checkingGeo
                  ? "Calcul de la distance..."
                  : "Tester l'Éligibilité Géographique"}
              </span>
            </button>

            {geoStatus && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 font-bold ${
                  geoStatus.eligible
                    ? "bg-emerald-100 border-emerald-300 text-emerald-950"
                    : "bg-amber-100 border-amber-300 text-amber-950"
                }`}
              >
                {geoStatus.eligible ? (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-700 shrink-0"
                  />
                ) : (
                  <AlertTriangle
                    size={18}
                    className="text-amber-700 shrink-0"
                  />
                )}
                <div>
                  <p>{geoStatus.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VALIDATION FINALE & CRÉATION DE COMPTE */}
        <button
          type="submit"
          disabled={submitting || !geoStatus || !geoStatus.eligible}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {submitting
              ? "Création du compte..."
              : "Valider et Créer mon Compte"}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="text-center pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onNavigateToLogin || (() => navigate("/login"))}
          className="text-gray-500 hover:text-emerald-800 font-bold underline"
        >
          Déjà un compte ? Connectez-vous ici
        </button>
      </div>
    </div>
  );
}

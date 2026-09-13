import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../../hooks/useRegister"; // IMPORT DU NOUVEAU HOOK
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  ShieldCheck,
  MapPin,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Sprout,
  Landmark,
  Store,
  CheckCircle2,
} from "lucide-react";

/**
 * COMPOSANT : Register.jsx
 * Responsabilité (SRP) : Gérer l'interface utilisateur, capturer les entrées 
 * et déléguer la création de compte au hook `useRegister`.
 */
export default function Register() {
  const navigate = useNavigate();
  // DÉLÉGATION DE LA LOGIQUE MÉTIER AU HOOK
  const { registerUser, isLoading, isCheckingGeo, error, setError } = useRegister();

  const [role, setRole] = useState("acheteur_prive");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    companyName: "",
    siret: "",
    phone: "",
    postalCode: "",
    city: "",
  });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isPasswordMatch =
    formData.password.length >= 8 &&
    passwordRegex.test(formData.password) &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isCheckingGeo) return;
    setError(null); // On utilise le setError fourni par le hook

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    // EXÉCUTION VIA LE SERVICE EXTERNALISÉ
    const result = await registerUser(formData, role);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-xs">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-800 rounded-3xl mb-2">
            <Sprout size={28} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Créer votre compte professionnel
          </h2>
          <p className="text-gray-500 font-medium">
            Plateforme d'alimentation locale et circuit court pour les
            professionnels.
          </p>
        </div>

        <div className="mt-6 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block font-extrabold text-gray-900 uppercase tracking-wider">
              1. Choisissez votre profil professionnel *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole("acheteur_public")}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  role === "acheteur_public"
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-extrabold ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50"
                }`}
              >
                <Landmark
                  size={22}
                  className={
                    role === "acheteur_public"
                      ? "text-emerald-700"
                      : "text-gray-400"
                  }
                />
                <span className="leading-tight">Acheteur Public</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Chorus Pro / Cantines
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("acheteur_prive")}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  role === "acheteur_prive"
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-extrabold ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50"
                }`}
              >
                <Store
                  size={22}
                  className={
                    role === "acheteur_prive"
                      ? "text-emerald-700"
                      : "text-gray-400"
                  }
                />
                <span className="leading-tight">Acheteur Pro B2B</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Restaurateurs / Commerces
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("producteur")}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  role === "producteur"
                    ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-extrabold ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50"
                }`}
              >
                <Sprout
                  size={22}
                  className={
                    role === "producteur" ? "text-emerald-700" : "text-gray-400"
                  }
                />
                <span className="leading-tight">Fournisseur</span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Exploitations Agricoles
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nom & Prénom du Responsable *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="displayName"
                    required
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Jean Dupont"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Raison Sociale / Enseigne *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Mairie de St-Rémy / Resto Bio"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Adresse E-mail Professionnelle *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@etablissement.fr"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Téléphone Direct *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="06 12 34 56 78"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
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
                pattern="\d{14}"
                value={formData.siret}
                onChange={handleChange}
                placeholder="12345678900012"
                className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
              <div>
                <label className="block font-bold text-emerald-950 mb-1">
                  Code Postal *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-emerald-600" size={16} />
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="28380"
                    className="w-full pl-9 pr-3 py-2.5 border border-emerald-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-emerald-950 mb-1">
                  Ville / Commune *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Saint-Rémy-sur-Avre"
                  className="w-full p-2.5 border border-emerald-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Mot de Passe Sécurisé *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 car. (Maj, chif., spéc.)"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Confirmer le Mot de Passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez le mot de passe"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {isPasswordMatch && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] pt-1">
                <CheckCircle2 size={14} />
                <span>Le mot de passe est sécurisé et correspond.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCheckingGeo || isLoading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white font-black rounded-2xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
            >
              {isCheckingGeo ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Vérification GeoFence (50 km)...</span>
                </>
              ) : isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Valider mon Inscription</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-gray-500 font-medium">
            <p>
              Déjà inscrit ?{" "}
              <Link
                to="/login"
                className="text-emerald-700 font-extrabold hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
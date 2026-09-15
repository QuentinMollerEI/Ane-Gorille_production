import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../../hooks/useRegister";
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
  Building,
  AlertCircle,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
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

  const [isSiretLoading, setIsSiretLoading] = useState(false);
  const [siretStatus, setSiretStatus] = useState(null); // 'success' | 'error' | null
  const [siretError, setSiretError] = useState("");
  const [verifiedCompany, setVerifiedCompany] = useState(null);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "siret") {
      setSiretStatus(null);
      setSiretError("");
      setVerifiedCompany(null);
    }
  };

  // VÉRIFICATION DU SIRET CORRIGÉE (RÉCUPÉRATION DE data.results[0])
  const handleVerifySiret = async (siretValue) => {
    const cleanSiret = String(siretValue || "").replace(/\s+/g, "");

    if (!cleanSiret) {
      setSiretStatus(null);
      setSiretError("");
      setVerifiedCompany(null);
      return;
    }

    if (cleanSiret.length !== 14 || isNaN(cleanSiret)) {
      setSiretStatus("error");
      setSiretError("Le numéro SIRET doit comporter exactement 14 chiffres.");
      return;
    }

    setIsSiretLoading(true);
    setSiretStatus(null);
    setSiretError("");

    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // CORRECTION : Récupération du 1er résultat dans le tableau
        const company = data.results[0];

        const etablissement =
          company.matching_etablissements?.find(
            (e) => e.siret === cleanSiret
          ) || company.siege;

        // Contrôle de l'état administratif ("A" = Actif)
        const isCompanyActive = company.etat_administratif === "A";
        const isEtablissementActive =
          etablissement?.etat_administratif === "A" ||
          etablissement?.etat_administratif !== "F"; // F = Fermé

        if (!isCompanyActive || !isEtablissementActive) {
          setSiretStatus("error");
          setSiretError("Cette entreprise ou cet établissement est enregistré comme fermé ou inactif.");
          return;
        }

        const info = {
          companyName: company.nom_complet || "",
          postalCode: etablissement?.code_postal || company.siege?.code_postal || "",
          city: etablissement?.libelle_commune || company.siege?.libelle_commune || "",
          address: etablissement?.adresse || company.siege?.adresse || "",
        };

        setSiretStatus("success");
        setVerifiedCompany(info);

        // Auto-complétion sans altération des noms de champs originaux
        setFormData((prev) => ({
          ...prev,
          companyName: prev.companyName || info.companyName,
          postalCode: prev.postalCode || info.postalCode,
          city: prev.city || info.city,
        }));
      } else {
        setSiretStatus("error");
        setSiretError("Aucune entreprise enregistrée pour ce numéro SIRET.");
      }
    } catch (err) {
      console.error("[SIRET API ERROR] :", err);
      setSiretStatus("error");
      setSiretError("Impossible de vérifier le SIRET auprès du registre national.");
    } finally {
      setIsSiretLoading(false);
    }
  };

  const isPasswordMatch =
    formData.password.length >= 8 &&
    passwordRegex.test(formData.password) &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isCheckingGeo || isSiretLoading) return;
    setError(null);

    if (formData.siret && siretStatus === "error") {
      setError("Veuillez renseigner un numéro SIRET valide et actif.");
      return;
    }

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

    const result = await registerUser(formData, role);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 text-xs animate-fade-in">
      <div className="text-center space-y-1.5 border-b pb-4">
        <h1 className="text-xl font-black text-gray-900 flex items-center justify-center gap-2">
          <ShieldCheck className="text-emerald-700" size={24} />
          <span>Créer votre compte professionnel</span>
        </h1>
        <p className="text-gray-500 font-medium text-xs">
          Plateforme d'alimentation locale et circuit court pour les professionnels.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Rôles */}
      <div className="space-y-2">
        <label className="font-extrabold text-gray-900 block uppercase tracking-wider text-[11px]">
          Type de Compte Professionnel *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: "acheteur_prive", label: "Acheteur Privé (B2B)", icon: Store },
            { id: "acheteur_public", label: "Acheteur Public (B2G)", icon: Landmark },
            { id: "producteur", label: "Producteur / Maraîcher", icon: Sprout },
            { id: "livreur", label: "Livreur / Transporteur", icon: ShieldCheck },
          ].map((item) => {
            const IconComp = item.icon;
            const isSelected = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs"
                    : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <IconComp size={18} className={isSelected ? "text-emerald-700" : "text-gray-400"} />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom & Prénom */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <User size={13} className="text-emerald-700" /> Nom & Prénom du Responsable *
            </label>
            <input
              type="text"
              name="displayName"
              required
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Ex: Martin Dupont"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <Mail size={13} className="text-emerald-700" /> Email Professionnel *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ex: contact@entreprise.fr"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* SIRET avec API INSEE corrigée */}
          <div className="space-y-1 md:col-span-2">
            <label className="font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 size={13} className="text-emerald-700" /> Numéro SIRET (14 chiffres) *
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Vérification en temps réel</span>
            </label>

            <div className="relative">
              <input
                type="text"
                name="siret"
                maxLength={14}
                required
                value={formData.siret}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  handleChange({ target: { name: "siret", value: val } });
                }}
                onBlur={(e) => handleVerifySiret(e.target.value)}
                placeholder="Ex: 12345678900012"
                className={`w-full p-2.5 pr-10 border rounded-xl font-mono text-xs outline-none transition ${
                  siretStatus === "success"
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold"
                    : siretStatus === "error"
                    ? "border-red-500 bg-red-50/30 text-red-950 font-bold"
                    : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
                }`}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSiretLoading && <Loader2 size={16} className="animate-spin text-emerald-700" />}
                {!isSiretLoading && siretStatus === "success" && (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                )}
                {!isSiretLoading && siretStatus === "error" && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>

            {siretError && (
              <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} /> {siretError}
              </p>
            )}

            {siretStatus === "success" && verifiedCompany && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium flex items-center gap-2 mt-1 animate-fade-in">
                <Building size={14} className="shrink-0 text-emerald-700" />
                <span>
                  <strong>{verifiedCompany.companyName}</strong> — {verifiedCompany.address}{" "}
                  ({verifiedCompany.postalCode} {verifiedCompany.city})
                </span>
              </div>
            )}
          </div>

          {/* Raison Sociale */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <Building2 size={13} className="text-emerald-700" /> Raison Sociale / Nom Établissement *
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Ex: Ferme du Val / Cantine Municipale"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <Phone size={13} className="text-emerald-700" /> Téléphone Portable / Fixe *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex: 06 12 34 56 78"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Code Postal */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <MapPin size={13} className="text-emerald-700" /> Code Postal *
            </label>
            <input
              type="text"
              name="postalCode"
              required
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Ex: 31000"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Ville */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <MapPin size={13} className="text-emerald-700" /> Ville *
            </label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              placeholder="Ex: Toulouse"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <Lock size={13} className="text-emerald-700" /> Mot de passe *
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 car. (A-z, 0-9, @)"
              className="w-full p-2.5 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Confirmation Mot de passe */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <Lock size={13} className="text-emerald-700" /> Confirmer le mot de passe *
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Répétez le mot de passe"
              className={`w-full p-2.5 border rounded-xl font-medium outline-none transition ${
                formData.confirmPassword.length > 0
                  ? isPasswordMatch
                    ? "border-emerald-500 bg-emerald-50/20"
                    : "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isCheckingGeo || isSiretLoading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
        >
          {isLoading || isCheckingGeo ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Création du compte et vérification géographique...</span>
            </>
          ) : (
            <>
              <span>Valider mon Inscription Professionnelle</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-gray-500 font-medium">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-bold text-emerald-800 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
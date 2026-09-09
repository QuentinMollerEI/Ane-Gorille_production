import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import {
  Building,
  User,
  Store,
  ShieldCheck,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";

/**
 * 📝 COMPOSANT : Register.jsx (Étape 1 - Authentification & Inscription)
 *
 * Design identique à la mire de Connexion (Login.jsx) :
 * - Logo officiel "/Logo.png" en haut avec badge circulaire
 * - Titre & Typographies aux nuances Vert Forêt (#2d5a3f) & Jaune Doré (#d4af37)
 * - Formulaire épuré : Rôle professionnel, E-mail, Mot de passe & Confirmation
 * - Redirection automatique & instantanée vers /dashboard dès la validation
 */
export default function Register({ onNavigateToLogin, onRegistrationSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate ? useNavigate() : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1️⃣ RÔLE PROFESSIONNEL (Défaut : Acheteur Public)
  const [role, setRole] = useState("client_public");

  // Clé secrète admin facultative
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");

  // Champs d'authentification Phase 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🚀 SÉCURITÉ ROUTEUR : Si l'utilisateur est déjà connecté, rediriger IMMÉDIATEMENT vers /dashboard
  useEffect(() => {
    if (user) {
      if (navigate) {
        navigate("/dashboard", { replace: true });
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, [user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation des mots de passe
    if (password !== confirmPassword) {
      setError("❌ Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("❌ Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    // Vérification de la clé admin si demandée
    let finalRole = role;
    if (showAdminKey) {
      if (adminKeyInput.trim() === "ADMIN2026") {
        finalRole = "admin";
      } else {
        setError("❌ Clé Administrateur incorrecte.");
        setLoading(false);
        return;
      }
    }

    try {
      // Étape A : Création du compte Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const authUser = userCredential.user;

      // Étape B : Création du document initial Firestore (users/{uid})
      const userPayload = {
        uid: authUser.uid,
        email: email.trim().toLowerCase(),
        role: finalRole, // "client_public" | "client_pro" | "producteur" | "admin"
        companyName: "",
        displayName: email.split("@")[0] || "Référent",
        phone: "",
        siret: "",
        address: "",
        city: "",
        zipCode: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        isProfileCompleted: false,
        stripeOnboardingStatus:
          finalRole === "producteur" ? "NOT_STARTED" : "N/A",
        isBioCertified: false,
      };

      await setDoc(doc(db, "users", authUser.uid), userPayload);

      // Étape C : Callbacks parent
      if (onRegistrationSuccess) {
        onRegistrationSuccess(userPayload);
      }

      // Étape D : REDIRECTION FORCEE IMMÉDIATE VERS LE DASHBOARD / ROUTER
      if (navigate) {
        navigate("/dashboard", { replace: true });
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Erreur d'inscription :", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cette adresse e-mail est déjà utilisée par un autre compte.");
      } else if (err.code === "auth/weak-password") {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError(
          err.message || "Une erreur est survenue lors de l'inscription.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else if (navigate) {
      navigate("/login");
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-gray-150 rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden">
        {/* EN-TÊTE HARMONISÉ : LOGO OFFICIELÂNE & GORILLE */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-full border-2 border-amber-400 bg-white p-2 shadow-md flex items-center justify-center transform hover:scale-105 transition-transform">
            <img
              src="/Logo.png"
              alt="Logo Âne & Gorille"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/64?text=AG";
              }}
            />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#2d5a3f] tracking-tight">
              Inscription
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Rejoignez le Marché de la Rosée (Étape 1/2)
            </p>
          </div>
        </div>

        {/* ALERTE ERREUR */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* 1️⃣ SÉLECTEUR DE RÔLE PROFESSIONNEL */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[#2d5a3f] uppercase tracking-wider">
              SÉLECTIONNEZ VOTRE RÔLE *
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRole("client_public");
                  setShowAdminKey(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  role === "client_public" && !showAdminKey
                    ? "bg-[#2d5a3f] text-white border-[#2d5a3f] font-bold shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium"
                }`}
              >
                <Building size={16} />
                <span className="text-[10px] leading-tight">Public (B2G)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("client_pro");
                  setShowAdminKey(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  role === "client_pro" && !showAdminKey
                    ? "bg-[#2d5a3f] text-white border-[#2d5a3f] font-bold shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium"
                }`}
              >
                <User size={16} />
                <span className="text-[10px] leading-tight">Pro (B2B)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("producteur");
                  setShowAdminKey(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  role === "producteur" && !showAdminKey
                    ? "bg-[#2d5a3f] text-white border-[#2d5a3f] font-bold shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium"
                }`}
              >
                <Store size={16} />
                <span className="text-[10px] leading-tight">Fournisseur</span>
              </button>
            </div>
          </div>

          {/* 2️⃣ E-MAIL */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider">
              EMAIL *
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-3 text-gray-400"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#2d5a3f] focus:border-transparent outline-none transition-all"
                placeholder="votre.email@domaine.fr"
              />
            </div>
          </div>

          {/* 3️⃣ MOT DE PASSE */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider">
              MOT DE PASSE *
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-3 text-gray-400"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#2d5a3f] focus:border-transparent outline-none transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* 4️⃣ CONFIRMATION MOT DE PASSE */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider">
              CONFIRMER LE MOT DE PASSE *
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-3 text-gray-400"
              />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 outline-none transition-all ${
                  confirmPassword && confirmPassword === password
                    ? "border-emerald-500 focus:ring-emerald-500"
                    : confirmPassword && confirmPassword !== password
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:ring-[#2d5a3f]"
                }`}
                placeholder="••••••••••••"
              />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[10px] text-red-500 font-bold mt-0.5">
                Les mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          {/* CLÉ ACCÈS ADMIN */}
          {showAdminKey && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 text-xs">
              <label className="block font-black text-purple-900 uppercase text-[10px]">
                CLÉ ADMINISTRATEUR
              </label>
              <input
                type="password"
                placeholder="Saisissez la clé (Ex: ADMIN2026)"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                className="w-full p-2 bg-white border border-purple-300 rounded-lg font-bold text-gray-800"
              />
            </div>
          )}

          {/* BOUTON PRINCIPAL D'INSCRIPTION */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d5a3f] hover:bg-[#234833] text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>S'INSCRIRE</span>
              </>
            )}
          </button>
        </form>

        {/* PIED DE CARTE / LIEN CONNEXION */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <p className="text-gray-500 font-semibold">
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-[#2d5a3f] font-bold hover:underline"
            >
              Se connecter
            </button>
          </p>

          <button
            type="button"
            onClick={() => setShowAdminKey(!showAdminKey)}
            className="text-purple-700 font-bold hover:underline text-[10px] flex items-center gap-1"
          >
            <Crown size={12} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

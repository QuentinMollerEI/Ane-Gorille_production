import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Redirection explicite vers le tableau de bord
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Erreur de connexion :", err);

      // Gestion précise des codes d'erreur Firebase
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Compte temporairement bloqué suite à de trop nombreuses tentatives. Réessayez plus tard.",
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Format d'adresse e-mail invalide.");
      } else {
        setError(
          "Impossible de se connecter. Vérifiez votre connexion réseau.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-200 animate-fade-in">
        {/* EN-TÊTE & LOGO */}
        <div className="text-center mb-8">
          <img
            src="/Logo.png"
            alt="Logo Âne & Gorille"
            className="w-16 h-16 mx-auto rounded-2xl border border-gray-150 shadow-sm object-cover mb-3"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h2 className="text-2xl font-black text-gray-900">Connexion</h2>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Espace d'approvisionnement en circuit court
          </p>
        </div>

        {/* BANNIÈRE D'ERREUR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl mb-6 font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULAIRE DE CONNEXION */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-gray-700 mb-1">
              Adresse E-mail :
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre-etablissement@domaine.fr"
              className="w-full px-4 py-3 text-xs border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-gray-700 mb-1">
              Mot de passe :
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 text-xs border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        {/* LIEN INSCRIPTION */}
        <p className="text-xs text-center text-gray-500 font-medium mt-6">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-emerald-700 font-extrabold hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Erreur de connexion :", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Compte temporairement bloqué suite à de trop nombreuses tentatives. Réessayez plus tard."
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Format d'adresse e-mail invalide.");
      } else {
        setError(
          "Impossible de se connecter. Vérifiez votre connexion réseau."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Veuillez saisir votre adresse e-mail ci-dessous pour réinitialiser votre mot de passe.");
      return;
    }
    setError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      if (typeof resetPassword === "function") {
        await resetPassword(email);
      } else {
        await sendPasswordResetEmail(auth, email);
      }
      setResetMessage("Un e-mail de réinitialisation de mot de passe vous a été envoyé.");
    } catch (err) {
      console.error("Erreur réinitialisation :", err);
      if (err.code === "auth/user-not-found") {
        setError("Aucun compte ne correspond à cette adresse e-mail.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format d'adresse e-mail invalide.");
      } else {
        setError("Impossible d'envoyer l'e-mail de réinitialisation. Vérifiez l'adresse renseignée.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        
        {/* EN-TÊTE & LOGO ÉCUSSON TRANSPARENT */}
        <div className="text-center space-y-2">
          <img
            src="/Logo.png"
            alt="Logo Âne & Gorille"
            className="mx-auto h-20 w-20 object-contain bg-transparent rounded-full"
          />
          <h2 className="mt-4 text-2xl font-black text-gray-900 tracking-tight">
            Connexion à votre compte
          </h2>
          <p className="text-xs font-semibold text-gray-500">
            Espace d'approvisionnement en circuit court — Âne & Gorille
          </p>
        </div>

        {/* BANNIÈRE D'ERREUR */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BANNIÈRE DE SUCCÈS RÉINITIALISATION */}
        {resetMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle size={18} className="shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* FORMULAIRE DE CONNEXION */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="nom@domaine.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Mot de passe
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-xs font-black rounded-xl text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-md disabled:opacity-50 uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* LIEN INSCRIPTION & MOT DE PASSE OUBLIÉ */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs font-semibold text-gray-600">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Créer un compte
            </Link>
          </p>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none disabled:opacity-50"
          >
            {resetLoading ? "Envoi..." : "Mot de passe oublié ?"}
          </button>
        </div>

      </div>
    </div>
  );
}
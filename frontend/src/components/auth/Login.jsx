import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Store, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, signInWithEmailAndPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");

    const cleanEmail = email ? email.trim() : "";
    if (!cleanEmail) {
      setError("Veuillez saisir votre adresse e-mail.");
      return;
    }
    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const loginFn = login || signInWithEmailAndPassword;
      if (typeof loginFn !== "function") {
        throw new Error("Fonction de connexion indisponible.");
      }

      const res = await loginFn(cleanEmail, password);
      console.log("✅ Connexion réussie :", res?.user?.email || cleanEmail);
      navigate("/dashboard");
    } catch (err) {
      console.error("🔴 Erreur Firebase Auth :", err?.code, err?.message, err);

      const errorCode = err?.code || "";
      if (errorCode === "auth/invalid-credential" || errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password") {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else if (errorCode === "auth/invalid-email") {
        setError("Format d'adresse e-mail invalide.");
      } else if (errorCode === "auth/too-many-requests") {
        setError("Trop de tentatives. Veuillez réinstaller un délai de quelques minutes.");
      } else if (errorCode === "auth/network-request-failed") {
        setError("Erreur réseau : vérifiez votre connexion ou la configuration Firebase.");
      } else {
        setError(err?.message || "Impossible de se connecter.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
          <Store className="text-emerald-700" size={28} />
          Espace Connexion Pro
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Plateforme B2B & B2G Âne & Gorille
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
            <Mail size={14} className="text-emerald-700" /> Adresse E-mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@entreprise.fr"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
            <Lock size={14} className="text-emerald-700" /> Mot de Passe
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Connexion en cours...</span>
            </>
          ) : (
            <span>Se Connecter</span>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-bold text-emerald-800 hover:underline">
            Créer un compte professionnel
          </Link>
        </p>
      </form>
    </div>
  );
}

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CartButton from "./CartButton";

/**
 * 🧭 COMPOSANT : Navbar.jsx
 * Emplacement : src/components/Navbar.jsx
 * Barre de navigation principale officielle avec Logo cliquable, profil et bouton dynamique.
 */
export default function Navbar({ activeView, onToggleView, onOpenCart }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const profile = userProfile || user || {};

  // Libellé officiel du rôle utilisateur
  const getRoleLabel = () => {
    const role = profile.role || profile.buyerRole || "";
    if (role === "acheteur_public" || role === "client_public" || profile.buyerProfile === "B2G") {
      return "Secteur Public (B2G)";
    }
    if (role === "producteur" || role === "producer" || role === "fournisseur" || role === "maraicher") {
      return "Producteur Maraîcher";
    }
    if (role === "livreur" || role === "carrier") {
      return "Livreur Logistique";
    }
    if (role === "admin") {
      return "Administrateur";
    }
    return "Professionnel B2B";
  };

  const getUserDisplayName = () => {
    return profile.companyName || profile.displayName || profile.name || "Acheteur Client";
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();
      }
      navigate("/");
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
    }
  };

  const handleProfileClick = () => {
    navigate("/dashboard?module=profil");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 text-xs font-sans shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO & NOM OFFICIEL - CLIQUABLE VERS L'ACCUEIL */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity group"
          title="Retour à l'accueil de présentation"
        >
          <img 
            src="/Logo.png" 
            alt="Âne & Gorille" 
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/Logo.png";
            }}
          />
          <div>
            <span className="font-black text-slate-900 text-base block leading-none tracking-tight">
              Âne &amp; Gorille
            </span>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mt-0.5">
              Plateforme &amp; Transport
            </span>
          </div>
        </Link>

        {/* ACTIONS & BOUTON DYNAMIQUE */}
        <div className="flex items-center gap-3">
          
          {/* 🛒 BOUTON DYNAMIQUE CONTEXTUEL AUTONOME */}
          <CartButton 
            activeView={activeView} 
            onToggleView={onToggleView} 
            onOpenCart={onOpenCart} 
          />

          {/* PROFIL UTILISATEUR CLIQUABLE */}
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-2.5 pl-3 border-l border-slate-200 cursor-pointer group hover:opacity-90 transition-opacity"
            title="Accéder à mon profil"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-black text-xs group-hover:bg-emerald-200 transition-colors shadow-2xs">
              {getUserInitial()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="font-extrabold text-slate-900 leading-tight group-hover:text-emerald-800 transition-colors">
                {getUserDisplayName()}
              </p>
              <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                {getRoleLabel()}
              </p>
            </div>
          </div>

          {/* BOUTON DÉCONNEXION */}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer ml-1"
            >
              <LogOut size={16} />
            </button>
          )}

        </div>

      </div>
    </header>
  );
}

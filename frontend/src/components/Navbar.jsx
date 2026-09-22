import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LogIn, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CartButton from "./CartButton";

/**
 * 🧭 COMPOSANT : Navbar.jsx
 * Emplacement : src/components/Navbar.jsx
 * 
 * Barre de navigation principale positionnée en sticky top-0 z-50 sur toute la largeur (sans barre de recherche).
 */
export default function Navbar({ activeView, onToggleView, onOpenCart }) {
  const { user, userProfile, logout, signOut } = useAuth();
  const navigate = useNavigate();
  const profile = userProfile || {};

  const getUserInitial = () => {
    if (!user) return "";
    const name = profile.companyName || profile.displayName || user.email || "";
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return profile.companyName || profile.displayName || user.email || "";
  };

  const getRoleLabel = () => {
    if (!user) return "";
    if (profile.role === "acheteur_public") return "Secteur Public (B2G)";
    if (profile.role === "producteur" || profile.role === "producer") return "Producteur Maraîcher";
    if (profile.role === "livreur" || profile.role === "carrier") return "Transporteur Logistique";
    return profile.role ? "Professionnel B2B" : "Compte Client";
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();
      } else if (typeof signOut === "function") {
        await signOut();
      }
      navigate("/login");
    } catch (e) {
      console.error("Erreur lors de la déconnexion :", e);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 w-full text-xs font-sans shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO OFFICIEL ÂNE & GORILLE */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity group"
          title="Retour à l'accueil"
        >
          <img 
            src="/Logo.png" 
            alt="Âne & Gorille" 
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <span className="hidden p-2 bg-emerald-800 text-white rounded-xl items-center justify-center shadow-xs">
            <Store size={20} />
          </span>
          <div>
            <span className="font-black text-slate-900 text-base block leading-none tracking-tight">
              Âne &amp; Gorille
            </span>
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mt-0.5">
              Plateforme &amp; Transport
            </span>
          </div>
        </Link>

        {/* ACTIONS : PANIER (SI CONNECTÉ), PROFIL ET AUTHENTIFICATION */}
        <div className="flex items-center gap-3">
          
          {/* 🛒 BOUTON PANIER : RENDU UNIQUEMENT SI L'UTILISATEUR EST CONNECTÉ */}
          {user && (
            <CartButton 
              activeView={activeView} 
              onToggleView={onToggleView} 
              onOpenCart={onOpenCart} 
            />
          )}

          {/* GESTION DU PROFIL OU BOUTON CONNEXION */}
          {user ? (
            /* 🟢 UTILISATEUR CONNECTÉ : Profil + Déconnexion */
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div 
                onClick={() => navigate("/dashboard?module=profil")}
                className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition-opacity"
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

              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer ml-1 flex items-center gap-1.5 font-bold text-xs"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            /* 🔴 UTILISATEUR DÉCONNECTÉ : Bouton unique "Connexion" */
            <div className="flex items-center pl-2 border-l border-slate-200">
              <Link
                to="/login"
                title="Se connecter"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2 text-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn size={16} />
                <span>Connexion</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
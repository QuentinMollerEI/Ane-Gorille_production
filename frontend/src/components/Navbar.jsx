import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { LogOut, ShoppingCart, Store, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const auth = useAuth() || {};
  const user = auth.user;
  const logout = auth.logout;

  // Récupération dynamique du panier
  const cartContext = useCart() || {};

  // Calcul du nombre d'articles dans le panier
  const itemCount = cartContext.getTotalItems 
    ? cartContext.getTotalItems() 
    : (() => {
        try {
          const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";
          const savedCart = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
          const parsed = savedCart ? JSON.parse(savedCart) : [];
          return parsed.reduce((acc, item) => acc + (item.quantity || 1), 0);
        } catch (e) {
          return 0;
        }
      })();

  const navigate = useNavigate();
  const location = useLocation();

  // 🔍 Détection de la page active
  const searchParams = new URLSearchParams(location.search);
  const isHomePage = location.pathname === "/";
  const isCartView = searchParams.get("view") === "cart";

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

  // 🔄 Navigation multi-contexte (Espace Pro / Mon Panier / Voir la Boutique)
  const handleButtonClick = () => {
    if (isHomePage) {
      navigate("/dashboard");
    } else if (isCartView) {
      navigate("/dashboard?module=boutique&view=grid");
    } else {
      navigate("/dashboard?module=boutique&view=cart");
    }
  };

  // 👤 Redirection au clic vers la page Mon Profil
  const handleProfileClick = () => {
    navigate("/dashboard?module=profil");
  };

  // 👤 Formattage du nom d'affichage de l'utilisateur
  const getUserDisplayName = () => {
    if (!user) return "";
    return (
      user.companyName ||
      user.displayName ||
      (user.email ? user.email.split("@")[0] : "Utilisateur")
    );
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const getRoleLabel = () => {
    if (!user?.role) return null;
    switch (user.role) {
      case "producer":
        return "Producteur";
      case "buyer_public":
        return "Acheteur Public";
      case "buyer_private":
        return "Acheteur Privé";
      case "carrier":
        return "Livreur";
      case "admin":
        return "Admin";
      default:
        return user.role;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 py-3 px-6 flex items-center justify-between shadow-xs sticky top-0 z-50">
      
      {/* 1. LOGO & MARQUE */}
      <Link to="/" className="flex items-center gap-3 group">
        <img
          src="/logo-ecusson-transparent.png"
          alt="Logo Âne & Gorille"
          className="h-10 w-10 object-contain bg-transparent rounded-full"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/Logo.png";
          }}
        />
        <div className="flex flex-col">
          <span className="font-black text-base text-gray-900 tracking-tight uppercase group-hover:text-emerald-700 transition-colors">
            Âne & Gorille
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Plateforme et Transport
          </span>
        </div>
      </Link>

      {/* 2. ACTIONS & IDENTIFICATION UTILISATEUR */}
      <div className="flex items-center gap-3">
        
        {/* 🚀 BOUTON DYNAMIQUE (Affiché uniquement si connecté) */}
        {user && (
          <button
            type="button"
            onClick={handleButtonClick}
            className="relative group px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer border active:scale-[0.97] bg-emerald-950 hover:bg-emerald-900 text-emerald-100 border-emerald-800/60 shadow-2xs hover:shadow-md"
          >
            {isHomePage ? (
              <>
                <LayoutDashboard
                  size={14}
                  className="stroke-[1.4] text-emerald-300 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-extrabold tracking-tight">Espace Pro</span>
              </>
            ) : isCartView ? (
              <>
                <Store
                  size={14}
                  className="stroke-[1.4] text-amber-300 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-extrabold tracking-tight">Voir la Boutique</span>
              </>
            ) : (
              <>
                <ShoppingCart
                  size={14}
                  className="stroke-[1.4] text-emerald-300 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="font-extrabold tracking-tight">Mon Panier</span>
              </>
            )}

            {/* BADGE COMPTEUR D'ARTICLES */}
            <span className="ml-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs border border-yellow-200/60">
              {itemCount}
            </span>
          </button>
        )}

        {/* CONTROLES ESPACE CONNECTÉ / VISITEUR */}
        {user ? (
          <div className="flex items-center gap-2 ml-2">
            
            {/* 👤 BADGE UTILISATEUR CLIQUABLE (Vers Mon Profil) */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50/70 border border-gray-200 hover:border-emerald-300 rounded-xl shadow-2xs transition-all cursor-pointer group text-left focus:outline-none"
              title="Accéder à mon profil"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200 transition-colors">
                {getUserInitial()}
              </div>
              <div className="flex flex-col max-w-[140px] truncate">
                <span className="text-[11px] font-extrabold text-gray-900 group-hover:text-emerald-900 truncate leading-tight transition-colors">
                  {getUserDisplayName()}
                </span>
                {getRoleLabel() && (
                  <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider truncate leading-tight">
                    {getRoleLabel()}
                  </span>
                )}
              </div>
            </button>

            {/* BOUTON DÉCONNEXION */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer border border-transparent hover:border-red-200"
              title="Se déconnecter"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-sm"
            >
              Créer un compte
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
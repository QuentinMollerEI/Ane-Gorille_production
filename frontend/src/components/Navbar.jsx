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

  // 🔄 Navigation multi-contexte adaptative (Acheteurs & Fournisseurs/Producteurs)
  const handleButtonClick = () => {
    const role = user?.role;
    const isSupplier = role === "producer" || role === "producteur" || role === "fournisseur";
    const isCarrier = role === "carrier" || role === "livreur";

    if (isHomePage) {
      if (isSupplier) {
        navigate("/dashboard?module=rayon");
      } else if (isCarrier) {
        navigate("/dashboard?module=route");
      } else {
        navigate("/dashboard?module=boutique");
      }
    } else if (isCartView) {
      if (isSupplier) {
        navigate("/dashboard?module=rayon");
      } else {
        navigate("/dashboard?module=boutique&view=grid");
      }
    } else {
      if (isSupplier) {
        navigate("/dashboard?module=rayon");
      } else {
        navigate("/dashboard?module=boutique&view=cart");
      }
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
      case "producteur":
      case "fournisseur":
        return "Producteur";
      case "buyer_public":
      case "acheteur_public":
      case "client_public":
        return "Acheteur Public";
      case "buyer_private":
      case "acheteur_prive":
      case "client_pro":
        return "Acheteur Privé";
      case "carrier":
      case "livreur":
        return "Livreur";
      case "admin":
        return "Admin";
      default:
        return user.role;
    }
  };

  const role = user?.role;
  const isSupplier = role === "producer" || role === "producteur" || role === "fournisseur";

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 1. LOGO & MARQUE */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="Logo Âne & Gorille"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/Logo.png";
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-gray-900 text-base leading-tight tracking-tight">
              Âne & Gorille
            </span>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              Plateforme et Transport
            </span>
          </div>
        </Link>

        {/* 2. ACTIONS & IDENTIFICATION UTILISATEUR */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* 🚀 BOUTON DYNAMIQUE (Affiché uniquement si connecté) */}
              <button
                onClick={handleButtonClick}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isHomePage ? (
                  <>
                    <LayoutDashboard size={16} />
                    <span>Espace Pro</span>
                  </>
                ) : isCartView ? (
                  <>
                    <Store size={16} />
                    <span>{isSupplier ? "Gestion des Stocks" : "Voir la Boutique"}</span>
                  </>
                ) : (
                  <>
                    {isSupplier ? (
                      <>
                        <Store size={16} />
                        <span>Mise en Rayon</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        <span>Mon Panier ({itemCount})</span>
                      </>
                    )}
                  </>
                )}
              </button>

              {/* BLOC PROFIL & DÉCONNEXION */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-xl transition-colors text-left cursor-pointer"
                  title="Accéder à Mon Profil"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                    {getUserInitial()}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                      {getUserDisplayName()}
                    </span>
                    {getRoleLabel() && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {getRoleLabel()}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

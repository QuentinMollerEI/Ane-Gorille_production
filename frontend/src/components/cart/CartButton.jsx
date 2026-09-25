import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * 🛒 COMPOSANT : CartButton.jsx
 * Adapter dynamiquement le libellé et l'action selon le rôle et le contexte :
 * - Rôle Pro / Accueil ("/") -> "Mon Espace Pro"
 * - Panier vide / Vue Panier active -> "Voir la boutique"
 * - Catalogue avec articles -> "Mon Panier" + Badge réactif en temps réel
 */
export default function CartButton({
  activeView: propActiveView,
  onToggleView,
  onOpenCart,
  className = "",
  ...props
}) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const profile = userProfile || user || {};
  const role = profile.role || profile.buyerRole || "";

  const isProRole = ["producteur", "producer", "maraicher", "artisan", "livreur", "carrier", "admin"].includes(role);
  const isHomePage = location.pathname === "/";

  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [currentView, setCurrentView] = useState(() => {
    if (propActiveView) return propActiveView;
    try {
      const searchParams = new URLSearchParams(location.search);
      return searchParams.get("view") === "cart" ? "cart" : "grid";
    } catch (e) {
      return "grid";
    }
  });

  useEffect(() => {
    if (propActiveView) {
      setCurrentView(propActiveView);
    } else {
      try {
        const searchParams = new URLSearchParams(location.search);
        setCurrentView(searchParams.get("view") === "cart" ? "cart" : "grid");
      } catch (e) {}
    }
  }, [propActiveView, location.search]);

  useEffect(() => {
    const handleViewChange = (evt) => {
      if (evt?.detail?.view) {
        setCurrentView(evt.detail.view);
      }
    };
    window.addEventListener("ane_gorille_view_changed", handleViewChange);
    return () => window.removeEventListener("ane_gorille_view_changed", handleViewChange);
  }, []);

  const calculateTotalItems = (cartArray) => {
    if (!Array.isArray(cartArray)) return 0;
    return cartArray.reduce(
      (sum, item) => sum + (Number(item.quantity || item.qty) || 1),
      0
    );
  };

  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return calculateTotalItems(parsed);
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(cartKey);
        if (!saved) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(saved);
        setCartCount(calculateTotalItems(parsed));
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCount();
  }, [cartKey, user?.uid]);

  useEffect(() => {
    const handleCartSync = (event) => {
      try {
        if (event?.detail?.cart && Array.isArray(event.detail.cart)) {
          setCartCount(calculateTotalItems(event.detail.cart));
          return;
        }
        const saved = localStorage.getItem(cartKey);
        if (!saved) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(saved);
        setCartCount(calculateTotalItems(parsed));
      } catch (e) {
        console.error("Erreur sync panier CartButton :", e);
      }
    };

    window.addEventListener("ane_gorille_cart_updated", handleCartSync);
    window.addEventListener("storage", handleCartSync);
    return () => {
      window.removeEventListener("ane_gorille_cart_updated", handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, [cartKey]);

  if (isHomePage || isProRole) {
    const handleGoToPro = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      let targetModule = "boutique";
      if (role === "producteur" || role === "producer" || role === "artisan") targetModule = "rayon";
      if (role === "livreur" || role === "carrier") targetModule = "route";
      navigate(`/dashboard?module=${targetModule}`);
    };

    return (
      <button
        type="button"
        onClick={handleGoToPro}
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer ${className}`}
        {...props}
      >
        <Store size={18} />
        <span>Mon Espace Pro</span>
      </button>
    );
  }

  if (cartCount === 0 || currentView === "cart") {
    const handleGoToShop = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof onToggleView === "function") {
        onToggleView("grid");
      }
      try {
        window.dispatchEvent(
          new CustomEvent("ane_gorille_view_changed", { detail: { view: "grid" } })
        );
      } catch (err) {}
      navigate("/dashboard?module=boutique&view=grid");
    };

    return (
      <button
        type="button"
        onClick={handleGoToShop}
        className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${className}`}
        {...props}
      >
        <Store size={18} />
        <span>Voir la boutique</span>
      </button>
    );
  }

  const handleOpenCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onOpenCart === "function") {
      onOpenCart();
    }
    if (typeof onToggleView === "function") {
      onToggleView("cart");
    }
    try {
      window.dispatchEvent(new CustomEvent("ane_gorille_open_cart"));
      window.dispatchEvent(
        new CustomEvent("ane_gorille_view_changed", { detail: { view: "cart" } })
      );
    } catch (err) {}
    navigate("/dashboard?module=boutique&view=cart");
  };

  return (
    <button
      type="button"
      onClick={handleOpenCart}
      className={`flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all relative cursor-pointer shadow-xs ${className}`}
      {...props}
    >
      <ShoppingCart size={18} />
      <span>Mon Panier</span>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
          {cartCount}
        </span>
      )}
    </button>
  );
}

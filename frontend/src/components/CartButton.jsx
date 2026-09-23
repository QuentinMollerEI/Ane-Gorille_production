import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, ShoppingBag, Store, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * 🛒 COMPOSANT DÉDIÉ : CartButton.jsx
 * Emplacement : src/components/CartButton.jsx
 *
 * Responsabilité Unique (SRP) :
 * Adapter dynamiquement le libellé, l'icône et l'action du bouton selon le contexte et le rôle :
 * 1. Utilisateur connecté Fournisseur / Producteur -> "Voir mon Stock" (vers /dashboard?module=rayon)
 * 2. Sur la page d'accueil ("/") -> "Mon Espace Pro"
 * 3. Quand le panier est vide (0) ou en vue Panier -> "Voir la boutique"
 * 4. Quand le panier contient des articles (>0) en vue Boutique -> "Mon Panier" + Badge d'articles réactif
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
  const role = (profile.role || profile.buyerRole || user?.role || "").toLowerCase();

  // Détection du rôle Fournisseur / Producteur / Maraîcher
  const isSupplier = [
    "producteur",
    "producer",
    "fournisseur",
    "maraicher"
  ].includes(role);

  const isHomePage = location.pathname === "/";
  const searchParams = new URLSearchParams(location.search);
  const isCartViewParam = searchParams.get("view") === "cart";

  // Vue active dynamique (Prop -> URL query -> state local)
  const [currentView, setCurrentView] = useState(() => {
    if (propActiveView) return propActiveView;
    return isCartViewParam ? "cart" : "grid";
  });

  useEffect(() => {
    if (propActiveView) {
      setCurrentView(propActiveView);
    } else {
      const params = new URLSearchParams(location.search);
      setCurrentView(params.get("view") === "cart" ? "cart" : "grid");
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

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const calculateTotalItems = (cartArray) => {
    if (!Array.isArray(cartArray)) return 0;
    return cartArray.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0);
  };

  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
      if (!saved) return 0;
      return calculateTotalItems(JSON.parse(saved));
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
        if (!saved) {
          setCartCount(0);
          return;
        }
        setCartCount(calculateTotalItems(JSON.parse(saved)));
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
        const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
        if (!saved) {
          setCartCount(0);
          return;
        }
        setCartCount(calculateTotalItems(JSON.parse(saved)));
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

  // --- RENDU SPÉCIFIQUE : Utilisateur est un Fournisseur / Producteur ---
  if (isSupplier) {
    const handleGoToStock = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof onToggleView === "function") {
        onToggleView("rayon");
      }
      try {
        window.dispatchEvent(new CustomEvent("ane_gorille_view_changed", { detail: { view: "rayon" } }));
      } catch (err) {}
      navigate("/dashboard?module=rayon");
    };

    return (
      <button
        type="button"
        onClick={handleGoToStock}
        className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white ${className}`}
        title="Accéder à la gestion de mon stock"
        {...props}
      >
        <Layers size={18} className="shrink-0 text-emerald-200" />
        <span>Voir mon Stock</span>
      </button>
    );
  }

  // --- RENDU 1 : Page d'accueil ("/") -> "Mon Espace Pro" ---
  if (isHomePage) {
    const handleGoToPro = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      let targetModule = "boutique";
      if (role === "producteur" || role === "producer") targetModule = "rayon";
      if (role === "livreur" || role === "carrier") targetModule = "route";
      navigate(`/dashboard?module=${targetModule}`);
    };

    return (
      <button
        type="button"
        onClick={handleGoToPro}
        className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs bg-slate-900 hover:bg-black text-white ${className}`}
        {...props}
      >
        <Store size={18} className="shrink-0 text-emerald-400" />
        <span>Mon Espace Pro</span>
      </button>
    );
  }

  // --- RENDU 2 : Panier VIDE (0) OU Vue Panier Active -> "Voir la boutique" ---
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
        window.dispatchEvent(new CustomEvent("ane_gorille_view_changed", { detail: { view: "grid" } }));
      } catch (err) {}
      navigate("/dashboard?module=boutique&view=grid");
    };

    return (
      <button
        type="button"
        onClick={handleGoToShop}
        className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs ${className}`}
        {...props}
      >
        <Store size={18} className="shrink-0 text-emerald-700" />
        <span>Voir la boutique</span>
      </button>
    );
  }

  // --- RENDU 3 : Panier NON VIDE (>0) en Vue Boutique -> "Mon Panier" + Badge ---
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
      window.dispatchEvent(new CustomEvent("ane_gorille_view_changed", { detail: { view: "cart" } }));
    } catch (err) {}
    navigate("/dashboard?module=boutique&view=cart");
  };

  return (
    <button
      type="button"
      onClick={handleOpenCart}
      className={`relative px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white ${className}`}
      {...props}
    >
      <ShoppingCart size={18} className="shrink-0" />
      <span>Mon Panier</span>
      {cartCount > 0 && (
        <span className="bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[10px] min-w-[20px] text-center shadow-xs animate-scale-in">
          {cartCount}
        </span>
      )}
    </button>
  );
}
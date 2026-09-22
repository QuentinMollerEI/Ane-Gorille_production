import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * 🛒 COMPOSANT DÉDIÉ : CartButton.jsx
 * Emplacement : src/components/CartButton.jsx
 *
 * Responsabilité Unique (SRP) :
 * Gérer les 3 états visuels et la navigation contextuelle dynamique :
 * 1. Sur la page d'accueil (/)                  -> "Mon Espace Pro"
 * 2. Sur l'espace pro avec un panier VIDE (0)   -> "Voir la Boutique"
 * 3. Sur l'espace pro avec un panier NON VIDE   -> "Mon Panier" + Badge d'articles réactif
 *
 * Connectivité : Écoute en temps réel les ajouts depuis ShopContainer et ProductDetail.
 */
export default function CartButton({ activeView: propActiveView, onToggleView, onOpenCart, className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? "ane_gorille_cart_" + user.uid : "ane_gorille_cart_guest";

  // Détection du contexte de page
  const isHomePage = location.pathname === "/";
  const searchParams = new URLSearchParams(location.search);
  const isCartViewParam = searchParams.get("view") === "cart";

  // Fonction utilitaire de calcul du nombre total d'articles
  const calculateTotalItems = (cartArray) => {
    if (!Array.isArray(cartArray)) return 0;
    return cartArray.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0);
  };

  // État local du décompte d'articles dans le panier
  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
      if (!saved) return 0;
      return calculateTotalItems(JSON.parse(saved));
    } catch (e) {
      return 0;
    }
  });

  // 1. Rechargement lors des changements de session ou d'utilisateur
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

  // 2. Synchronisation événementielle instantanée en temps réel (Custom Events + Storage)
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
        console.error("Erreur de synchronisation panier CartButton :", e);
      }
    };

    window.addEventListener("ane_gorille_cart_updated", handleCartSync);
    window.addEventListener("storage", handleCartSync);

    return () => {
      window.removeEventListener("ane_gorille_cart_updated", handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, [cartKey]);

  // --- VISUEL 1 : Page d'accueil ("/") -> "Mon Espace Pro" ---
  if (isHomePage) {
    const handleGoToPro = (e) => {
      e.preventDefault();
      navigate("/dashboard");
    };

    return (
      <button
        type="button"
        onClick={handleGoToPro}
        className={`bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2 text-xs hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <Store size={16} />
        <span>Mon Espace Pro</span>
      </button>
    );
  }

  // --- VISUEL 2 : Espace Pro + Panier VIDE (cartCount === 0) -> "Voir la Boutique" ---
  if (cartCount === 0) {
    const handleGoToShop = (e) => {
      e.preventDefault();
      if (onToggleView) {
        onToggleView("grid");
      } else {
        window.dispatchEvent(new CustomEvent("ane_gorille_view_changed", { detail: { view: "grid" } }));
        navigate("/dashboard?module=boutique&view=grid");
      }
    };

    return (
      <button
        type="button"
        onClick={handleGoToShop}
        className={`bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2 text-xs hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <ShoppingBag size={16} />
        <span className="hidden sm:inline">Voir la Boutique</span>
      </button>
    );
  }

  // --- VISUEL 3 : Espace Pro + Panier NON VIDE (cartCount > 0) -> "Mon Panier" + Badge ---
  const handleOpenCart = (e) => {
    e.preventDefault();
    if (onOpenCart) {
      onOpenCart();
    } else if (onToggleView) {
      onToggleView("cart");
    } else {
      window.dispatchEvent(new CustomEvent("ane_gorille_view_changed", { detail: { view: "cart" } }));
      window.dispatchEvent(new CustomEvent("ane_gorille_open_cart"));
      navigate("/dashboard?module=boutique&view=cart");
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenCart}
      className={`relative bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <ShoppingCart size={18} />
      <span className="hidden sm:inline">Mon Panier</span>

      {/* BADGE ANIMÉ COMPTABILISANT LES ARTICLES */}
      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-black transition-all bg-amber-400 text-slate-950 animate-pulse">
        {cartCount}
      </span>
    </button>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * 🛒 COMPOSANT DÉDIÉ : CartButton.jsx
 * Emplacement : src/components/CartButton.jsx
 *
 * Responsabilité Unique (SRP) :
 * 1. Gérer l'état réactif du nombre d'articles dans le panier selon l'utilisateur (cloisonnement RGPD).
 * 2. Écouter en temps réel les événements de mutation du panier ("ane_gorille_cart_updated" et "storage").
 * 3. Rendu dynamique conditionnel :
 *    - Si le panier est VIDE (0 article) -> Affiche "Voir la Boutique"
 *    - Si le panier CONTIENT des articles (> 0) -> Affiche "Mon Panier" + Badge réactif animé
 */
export default function CartButton({ onOpenCart, onToggleView, className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  // État local du nombre d'articles dans le panier
  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0)
        : 0;
    } catch (e) {
      return 0;
    }
  });

  // 1. Rechargement du panier lors du changement de session / utilisateur
  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
        if (!saved) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(saved);
        const total = Array.isArray(parsed)
          ? parsed.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0)
          : 0;
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCount();
  }, [cartKey, user?.uid]);

  // 2. Écoute réactive instantanée en temps réel (Custom Events + Storage)
  useEffect(() => {
    const handleCartSync = (event) => {
      try {
        if (event?.detail?.cart && Array.isArray(event.detail.cart)) {
          const total = event.detail.cart.reduce(
            (sum, item) => sum + (Number(item.quantity || item.qty) || 1),
            0
          );
          setCartCount(total);
          return;
        }

        const saved = localStorage.getItem(cartKey) || localStorage.getItem("ane_gorille_cart");
        if (!saved) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(saved);
        const total = Array.isArray(parsed)
          ? parsed.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0)
          : 0;
        setCartCount(total);
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

  // --- RENDU 1 : PANIER VIDE (0 article) -> Affiche "Voir la Boutique" ---
  if (cartCount === 0) {
    const handleGoToShop = (e) => {
      if (e) e.preventDefault();
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
        className={`bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 text-xs hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <ShoppingBag size={18} />
        <span className="hidden sm:inline">Voir la Boutique</span>
      </button>
    );
  }

  // --- RENDU 2 : PANIER NON VIDE (> 0 article) -> Affiche "Mon Panier" + Badge ---
  const handleOpenCart = (e) => {
    if (e) e.preventDefault();
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

      {/* BADGE COMPTEUR RÉACTIF ANIMÉ */}
      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-black transition-all bg-amber-400 text-slate-950 animate-pulse">
        {cartCount}
      </span>
    </button>
  );
}

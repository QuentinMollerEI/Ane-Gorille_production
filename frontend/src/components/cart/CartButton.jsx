import React, { useState, useEffect } from "react";
import { ShoppingCart, Store, ShoppingBag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
// ⚠️ CORRECTION D'IMPORT : Le chemin remonte de deux niveaux depuis components/cart/
import { useAuth } from "../../context/AuthContext";

/**
 * 🛒 COMPOSANT DÉDIÉ : CartButton.jsx
 * Emplacement : src/components/cart/CartButton.jsx
 */
export default function CartButton({ activeView: propActiveView, onToggleView, onOpenCart, className = "" }) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const profile = userProfile || user || {};
  const isProRole = ["producteur", "maraicher", "livreur", "carrier", "admin"].includes(profile.role);

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  // ⚠️ CORRECTION SYNTAXIQUE 1 : Le bloc try/catch est désormais complet et refermé.
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
    const handleViewChange = (evt) => {
      if (evt?.detail?.view) {
        setCurrentView(evt.detail.view);
      }
    };
    window.addEventListener("ane_gorille_view_changed", handleViewChange);
    return () => window.removeEventListener("ane_gorille_view_changed", handleViewChange);
  }, []);

  // Décompte réactif du panier
  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      if (!saved) return 0;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 1), 0)
        : 0;
    } catch (e) {
      return 0;
    }
  });

  // 1. Rechargement du panier lors du changement d'utilisateur
  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem(cartKey);
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
        const saved = localStorage.getItem(cartKey);
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

  // --- RENDU 1 : Rôle Pro (Producteur, Livreur, Admin) ---
  if (isProRole) {
    return (
      <button 
        onClick={() => navigate("/dashboard")}
        className={`flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm transition-colors ${className}`}
      >
        <Store size={18} />
        <span>Mon Espace Pro</span>
      </button>
    );
  }

  // --- RENDU 2 : Vue Panier Active (Proposer "Voir la boutique") ---
  if (currentView === "cart") {
    return (
      <button 
        onClick={() => {
          if (onToggleView) onToggleView("grid");
          else navigate("/dashboard?module=boutique&view=grid");
        }}
        className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors ${className}`}
      >
        <Store size={18} />
        <span>Voir la boutique</span>
      </button>
    );
  }

  // --- RENDU 3 : Par défaut (Panier visible) ---
  return (
    <button 
      onClick={() => {
        if (onOpenCart) onOpenCart();
        else if (onToggleView) onToggleView("cart");
        else navigate("/dashboard?module=boutique&view=cart");
      }}
      className={`flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm transition-colors relative ${className}`}
    >
      <ShoppingCart size={18} />
      <span>Mon Panier</span>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
          {cartCount}
        </span>
      )}
    </button>
  );
} // ⚠️ CORRECTION SYNTAXIQUE 2 : Clôture propre de l'accolade ouverte à la ligne 11.
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; // Import du contexte d'authentification unifié

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé au sein d'un CartProvider");
  }
  return context;
};

/**
 * 🛒 PROVIDER DU PANIER : CartContext.jsx (v3)
 * Responsabilité unique (SRP) : Gérer l'état du panier d'achat, calculer les totaux,
 * et synchroniser le cycle de vie du panier avec la session utilisateur.
 * 🔒 SÉCURITÉ : Le panier se vide automatiquement à la déconnexion et est invisible hors-ligne.
 */
export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Écoute directe du profil utilisateur connecté
  const [cartItems, setCartItems] = useState([]);

  // 1. Synchronisation de la session : Chargement ou Purge automatique
  useEffect(() => {
    if (user?.uid) {
      // Charger le panier spécifique à l'utilisateur depuis localStorage
      const savedCart = localStorage.getItem(`cart_${user.uid}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Erreur de lecture du panier local :", e);
          setCartItems([]);
        }
      }
    } else {
      // 🔒 HORS-CONNEXION : Si aucun utilisateur n'est connecté, le panier est vidé instantanément
      setCartItems([]);
    }
  }, [user]);

  // 2. Persistance locale sécurisée par identifiant utilisateur
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Actions de modification du panier (SRP)
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    if (user?.uid) {
      localStorage.removeItem(`cart_${user.uid}`);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) =>
        total + (item.priceHT || item.price || 0) * item.quantity,
      0,
    );
  };

  const value = {
    cartItems,
    cartTotal: getCartTotal(),
    addToCart,
    removeFromCart,
    clearCart,
    // 🔒 SECURITE STRICTE : Le panier n'est jamais visible si l'utilisateur est déconnecté (user === null)
    isCartVisible: user !== null && cartItems.length > 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

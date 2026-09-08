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
 * 🛒 PROVIDER DU PANIER : CartContext.jsx (v3 - Sécurisé & Normalisé)
 * Responsabilité unique (SRP) : Gérer l'état du panier d'achat, calculer les totaux,
 * et synchroniser le cycle de vie du panier avec la session utilisateur.
 *
 * 🛡️ NOUVEAUTÉ - NORMALISATION DEFENSIVE :
 * Assure la conformité immédiate des articles avec les exigences de la Cloud Function v2
 * (présence obligatoire de .id, .price, .producerId, et .vatRate) pour éliminer les erreurs 500.
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
    if (!product) return;

    // 🛡️ NORMALISATION DEFENSIVE :
    // On re-mappe immédiatement le produit pour garantir que toutes les clés requises
    // par Firestore et la Cloud Function v2 existent et sont typées correctement.
    const normalizedProduct = {
      id: product.id || product.productId || product._id, // Garantit l'ID unique recherché par Firestore
      name: product.name || "Article sans nom",
      price: Number(product.price || product.priceHT || 0), // Convertit en Nombre pour éviter NaN dans les calculs
      vatRate: Number(product.vatRate || 5.5), // Taux de TVA fiscal par défaut (5.5%)
      producerId: product.producerId || "PROD_INCONNU",
      producerName: product.producerName || "Maraîcher Coopératif",
      category: product.category || "Autre",
      unit: product.unit || "kg",
    };

    // Alerte console de développement si l'ID est manquant pour ne pas corrompre le panier
    if (!normalizedProduct.id) {
      console.error(
        "⚠️ Impossible d'ajouter l'article : aucun identifiant unique trouvé (id, productId ou _id).",
        product,
      );
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.id === normalizedProduct.id,
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === normalizedProduct.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prevItems, { ...normalizedProduct, quantity }];
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

  // Calcul du total TTC basé sur la propriété normalisée .price
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.price || 0) * item.quantity,
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

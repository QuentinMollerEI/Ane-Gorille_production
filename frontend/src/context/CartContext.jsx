import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // 1. Initialisation sécurisée depuis le localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('ane_gorille_cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erreur lors du chargement du panier :", error);
      return [];
    }
  });

  // 2. Sauvegarde automatique à chaque modification du panier
  useEffect(() => {
    localStorage.setItem('ane_gorille_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Ajout au panier avec verrouillage strict sur le stock
  const addToCart = (product, requestedQuantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      let newQty = currentQty + requestedQuantity;

      // VERROU 1 : Plafonnement automatique au stock disponible
      if (newQty > product.stock) {
        console.warn(`Stock max atteint pour ${product.title || product.name}. Reste : ${product.stock}`);
        newQty = product.stock;
      }

      // Si le plafond était déjà atteint, on évite un re-rendu inutile
      if (currentQty === newQty) {
        return prevItems;
      }

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }

      // Nouveau produit : on embarque toutes les infos nécessaires pour le CheckoutOrchestrator
      return [...prevItems, { ...product, quantity: newQty }];
    });
  };

  // 4. Mise à jour manuelle des quantités depuis la page panier
  const updateQuantity = (productId, newQuantity, availableStock) => {
    let safeQuantity = Number(newQuantity);

    // VERROU 2 : Plafonnement à la saisie manuelle
    if (safeQuantity > availableStock) {
      safeQuantity = availableStock;
    }

    if (safeQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: safeQuantity } : item
      )
    );
  };

  // 5. Suppression d'un article
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // 6. Vidage complet (À appeler UNIQUEMENT après un succès de paiement)
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ane_gorille_cart');
  };

  // 7. Calculs utilitaires dérivés pour l'UI (Navbar, Checkout)
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotalHT = cartItems.reduce((total, item) => {
    const price = Number(item.priceHT ?? item.price ?? 0);
    return total + (price * item.quantity);
  }, 0);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartItemCount,
    cartTotalHT
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
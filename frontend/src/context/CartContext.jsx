import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      setCart(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCart([]);
    }
  }, [cartKey]);

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      window.dispatchEvent(
        new CustomEvent("ane_gorille_cart_updated", { detail: { cart } })
      );
    } catch (e) {
      console.error("Erreur sauvegarde panier :", e);
    }
  }, [cart, cartKey]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const calculateTotals = () => {
    const rawItemsHT = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const platformCommissionHT = Math.round(rawItemsHT * 0.12 * 100) / 100;
    const vendorPayoutHT = Math.round((rawItemsHT - platformCommissionHT) * 100) / 100;

    let shippingCostHT = 15;
    if (rawItemsHT >= 300) {
      shippingCostHT = 0;
    } else if (rawItemsHT >= 150) {
      shippingCostHT = 8;
    }

    const tvaProducts = Math.round(rawItemsHT * 0.055 * 100) / 100;
    const tvaShipping = Math.round(shippingCostHT * 0.20 * 100) / 100;
    const totalTTC = Math.round((rawItemsHT + shippingCostHT + tvaProducts + tvaShipping) * 100) / 100;

    return {
      subtotalHT: rawItemsHT,
      platformCommissionHT,
      vendorPayoutHT,
      shippingCostHT,
      tvaProducts,
      tvaShipping,
      totalTTC,
      meetsMinimumOrder: rawItemsHT >= 50
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        calculateTotals
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
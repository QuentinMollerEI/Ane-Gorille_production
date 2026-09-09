import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("ane_gorille_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ane_gorille_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdate"));
    } catch (e) {
      console.error("Erreur de sauvegarde du panier local :", e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const addQty = Number(quantity) !== 0 ? Number(quantity) : 1;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id,
      );

      const normalizedPriceHT = Number(product.priceHT ?? product.price ?? 0);
      const normalizedVatRate = Number(product.vatRate ?? product.vat ?? 5.5);
      const normalizedTitle =
        product.title || product.name || "Produit sans nom";
      const normalizedProducer =
        product.producer || product.producerName || "Producteur local";

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + addQty;
        if (newQty <= 0) {
          return updated.filter((item) => item.id !== product.id);
        }
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          qty: newQty,
        };
        return updated;
      }

      if (addQty <= 0) return prevCart;

      return [
        ...prevCart,
        {
          ...product,
          title: normalizedTitle,
          name: normalizedTitle,
          priceHT: normalizedPriceHT,
          price: normalizedPriceHT,
          vatRate: normalizedVatRate,
          vat: normalizedVatRate,
          producer: normalizedProducer,
          producerName: normalizedProducer,
          quantity: addQty,
          qty: addQty,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  return (
    context || {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
    }
  );
}

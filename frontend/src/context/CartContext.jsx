import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import TaxAndFeeCalculator from "../utils/TaxAndFeeCalculator.js";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [cartItems, setCartItems] = useState(() => {
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
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch (e) {}
  }, [cartKey]);

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems, cartKey]);

  const addToCart = (product, quantityToAdd = 1) => {
    if (!product || !product.id) return;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      const requestedQty = Math.max(1, Number(quantityToAdd) || 1);
      const availableStock = Number(
        product.stock ?? product.quantity ?? product.stockQuantity ?? 999
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentQty = updated[existingIndex].quantity || 1;
        const newQty = Math.min(availableStock, currentQty + requestedQty);
        
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          stock: availableStock
        };
        return updated;
      }

      const initialQty = Math.min(availableStock, requestedQty);
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name || product.title || "Produit sans nom",
          title: product.title || product.name || "Produit sans nom",
          priceHT: Number(product.priceHT ?? product.price ?? 0),
          vatRate: Number(product.vatRate ?? (product.category === "artisanat" ? 20 : 5.5)),
          unit: product.unit || "kg",
          producerId: product.producerId || product.userId || "fournisseur_general",
          producerName: product.producerName || product.farmName || product.companyName || "Producteur Partenaire",
          stripeAccountId: product.stripeAccountId || null,
          category: product.category || "maraichage",
          imageUrl: product.imageUrl || product.image || "/placeholder.png",
          quantity: initialQty,
          stock: availableStock,
          batchNumber: product.batchNumber || "L-2026-001"
        }
      ];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    setCartItems((prev) => {
      const target = prev.find((i) => i.id === productId);
      if (!target) return prev;

      const qty = Number(newQuantity);
      if (qty <= 0) {
        return prev.filter((i) => i.id !== productId);
      }

      const maxStock = Number(target.stock ?? 999);
      const safeQty = Math.min(maxStock, qty);

      return prev.map((item) =>
        item.id === productId ? { ...item, quantity: safeQty } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(cartKey);
    } catch (e) {}
  };

  const itemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const totals = useMemo(() => {
    return TaxAndFeeCalculator.calculateCartTotals(cartItems);
  }, [cartItems]);

  const subOrdersGrouped = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const pId = item.producerId || "fournisseur_general";
      if (!map[pId]) {
        map[pId] = {
          producerId: pId,
          producerName: item.producerName || "Producteur Partenaire",
          stripeAccountId: item.stripeAccountId || null,
          items: [],
          totalHT: 0,
          totalVAT: 0
        };
      }

      const pHT = Number(item.priceHT) || 0;
      const qty = Number(item.quantity) || 1;
      const vRate = Number(item.vatRate) || 5.5;

      const lineHT = pHT * qty;
      const lineVAT = lineHT * (vRate / 100);

      map[pId].items.push({
        ...item,
        lineHT
      });
      map[pId].totalHT += lineHT;
      map[pId].totalVAT += lineVAT;
    });
    return map;
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemsCount,
        subOrdersGrouped,
        ...totals
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};

export default CartContext;
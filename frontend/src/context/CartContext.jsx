import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TaxAndFeeCalculator } from '../utils/TaxAndFeeCalculator';

const CartContext = createContext(null);

/**
 * 🛒 CONTEXTE DE GESTION DU PANIER & CALCULS FINANCIERS CERTIFIÉS
 * Emplacement : frontend/src/context/CartContext.jsx
 * 
 * Responsabilité :
 * - Stockage des articles du panier dans localStorage
 * - Calcul certifié en temps réel via TaxAndFeeCalculator :
 *   1. Sous-total Produits HT
 *   2. TVA Alimentaire (5.5% / 20%)
 *   3. Frais de Livraison B2B Dégressifs (15€ HT / 8€ HT / Franco dès 300€ HT)
 *   4. TVA Transport (20%)
 *   5. Grand Total TTC certifié (ex: 31.08 € TTC au lieu des 13.08 € bruts)
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('ane_gorille_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.warn("Erreur chargement panier local :", e);
      return [];
    }
  });

  // Synchronisation automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ane_gorille_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error("Erreur sauvegarde panier local :", e);
    }
  }, [cartItems]);

  // Ajouter un produit au panier avec contrôle du stock disponible
  const addToCart = (product, quantityToAdd = 1) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === product.id);
      const stockMax = Number(product.stockQuantity ?? product.stock ?? 999);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentQty = updated[existingIndex].quantity || 1;
        const newQty = Math.min(currentQty + quantityToAdd, stockMax);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        const initialQty = Math.min(quantityToAdd, stockMax);
        return [...prevItems, { ...product, quantity: initialQty }];
      }
    });
  };

  // Modifier la quantité d'un article
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const stockMax = Number(item.stockQuantity ?? item.stock ?? 999);
          return { ...item, quantity: Math.min(newQuantity, stockMax) };
        }
        return item;
      })
    );
  };

  // Supprimer un article du panier
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Vider totalement le panier
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ane_gorille_cart');
  };

  // 🧮 CALCUL DES TOTAUX FINANCIERS CERTIFIÉS
  const totals = useMemo(() => {
    return TaxAndFeeCalculator.computeOrderTotals(cartItems);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totals,
    // Raccourcis pour l'affichage direct dans vos boutons et récapitulatifs :
    itemsTotalHT: totals.itemsTotalHT || 0,
    itemsVAT: totals.itemsVAT || 0,
    shippingFeeHT: totals.shippingFeeHT || 0,
    shippingVAT: totals.shippingVAT || 0,
    grandTotalTTC: totals.grandTotalTTC || 0,
    formattedGrandTotalTTC: (totals.grandTotalTTC || 0).toFixed(2),
    itemCount: cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};

export default CartContext;

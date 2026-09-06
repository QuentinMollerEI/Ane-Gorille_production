import React, { useState, useEffect } from "react";
import useProducts from "../../hooks/useProducts";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailModal from "./components/ProductDetailModal";
import CartContainer from "./components/CartContainer";
import { ShoppingBag, ChevronLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // 🛡️ Import indispensable pour identifier l'utilisateur

export default function ShopContainer() {
  const { products, loading, error } = useProducts();
  const { user } = useAuth(); // 👤 Récupération de la session de l'utilisateur actif

  const [currentView, setCurrentView] = useState("shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState("");
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // 🔑 Génération d'une clé de localStorage dynamique et isolée par UID utilisateur
  const cartKey = user?.uid
    ? `ane_gorille_cart_${user.uid}`
    : "ane_gorille_cart_guest";

  // 🔄 Re-charger le panier spécifique dès que l'utilisateur connecté change (connexion / déconnexion)
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Erreur de lecture du panier :", err);
        setCartItems([]);
      }
    } else {
      setCartItems([]); // Réinitialisation de sécurité si aucun panier n'est enregistré pour cet ID
    }
  }, [cartKey]); // Dépendance sur cartKey pour déclencher le rechargement au changement de compte !

  // 💾 Sauvegarde automatique du panier dans l'espace personnel de l'utilisateur actif
  const saveCart = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem(cartKey, JSON.stringify(newItems));
  };

  const handleAddToCart = (product, quantity) => {
    const qtyToAdd = Number(quantity || 1);
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);
    let updatedCart;

    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      const newQty =
        Number(updatedCart[existingIndex].quantity || 0) + qtyToAdd;

      if (product.stock && newQty > product.stock) {
        alert(`⚠️ Stock limité à ${product.stock} ${product.unit || "kg"}.`);
        return;
      }
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
        qty: newQty,
      };
    } else {
      updatedCart = [
        ...cartItems,
        { ...product, quantity: qtyToAdd, qty: qtyToAdd },
      ];
    }

    saveCart(updatedCart);
    setSelectedProduct(null);
    setCurrentView("cart");
  };

  const handleUpdateQuantity = (productId, newQty) => {
    const qty = Math.max(1, Number(newQty));
    const target =
      products.find((p) => p.id === productId) ||
      cartItems.find((p) => p.id === productId);

    if (target?.stock && qty > target.stock) {
      alert(`⚠️ Stock disponible : ${target.stock} ${target.unit || "kg"}.`);
      return;
    }

    saveCart(
      cartItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty, qty: qty } : item,
      ),
    );
  };

  const handleRemoveItem = (productId) =>
    saveCart(cartItems.filter((item) => item.id !== productId));
  const handleClearCart = () => saveCart([]);

  const displayProducts =
    products.length > 0
      ? products
      : [
          {
            id: 1,
            title: "Pommes de terre de conservation",
            priceHT: 2.37,
            vatRate: 5.5,
            isAvailable: true,
            isBio: true,
            producer: "Producteur de la Rosée",
            stock: 50,
            unit: "kg",
          },
          {
            id: 2,
            title: "Carottes fanes de saison",
            priceHT: 3.03,
            vatRate: 5.5,
            isAvailable: true,
            isBio: false,
            producer: "Producteur de la Rosée",
            stock: 80,
            unit: "kg",
          },
          {
            id: 3,
            title: "Tomates anciennes charnues",
            priceHT: 4.55,
            vatRate: 5.5,
            isAvailable: false,
            isBio: true,
            producer: "Ferme des Écureuils",
            stock: 0,
            unit: "kg",
          },
        ];

  const uniqueProducers = [
    ...new Set(displayProducts.map((p) => p.producer).filter(Boolean)),
  ];

  const filteredProducts = displayProducts.filter((product) => {
    const matchesSearch = (product.title || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesProducer =
      !selectedProducer || product.producer === selectedProducer;
    const matchesBio = !onlyBio || product.isBio;
    return matchesSearch && matchesProducer && matchesBio;
  });

  const cartCount = cartItems.reduce(
    (acc, item) => acc + Number(item.quantity || item.qty || 0),
    0,
  );

  if (currentView === "cart") {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentView("shop")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 font-bold transition-colors"
          >
            <ChevronLeft size={16} /> Retour à la boutique
          </button>
          <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-150 px-3 py-1 rounded-full">
            Panier Sécurisé
          </span>
        </div>
        <CartContainer
          cartItems={cartItems}
          onClearCart={handleClearCart}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Boutique & Catalogue
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez le marché de proximité et préparez votre commande.
          </p>
        </div>
        <button
          onClick={() => setCurrentView("cart")}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-all shadow-sm"
        >
          <ShoppingBag size={18} />
          <span>Mon panier ({cartCount})</span>
        </button>
      </div>

      {!loading && !error && (
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProducer={selectedProducer}
          setSelectedProducer={setSelectedProducer}
          onlyBio={onlyBio}
          setOnlyBio={setOnlyBio}
          producers={uniqueProducers}
        />
      )}

      {loading && products.length === 0 && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
      )}

      {error && products.length === 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {(!loading || products.length > 0) && (
        <ProductGrid
          products={filteredProducts}
          onOpenDetails={setSelectedProduct}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

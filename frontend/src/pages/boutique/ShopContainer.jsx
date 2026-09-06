import React, { useState, useEffect } from "react";
import useProducts from "../../hooks/useProducts";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailModal from "./components/ProductDetailModal";
import CartContainer from "./components/CartContainer";
import { ShoppingBag, ChevronLeft, Loader2 } from "lucide-react";

export default function ShopContainer() {
  // 🔗 CONNEXION DIRECTE À LA BASE DE DONNÉES (Aucune simulation)
  const { products, loading, error } = useProducts();

  const [currentView, setCurrentView] = useState("shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState("");
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("ane_gorille_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Erreur de lecture du panier :", err);
      }
    }
  }, []);

  const saveCart = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem("ane_gorille_cart", JSON.stringify(newItems));
  };

  const handleAddToCart = (product, quantity) => {
    const qtyToAdd = Number(quantity || 1);
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);
    let updatedCart;

    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      const newQty =
        Number(updatedCart[existingIndex].quantity || 0) + qtyToAdd;

      if (product.stock !== undefined && newQty > product.stock) {
        alert(`⚠️ Stock limité à ${product.stock} ${product.unit || "kg"}.`);
        return;
      }
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
      };
    } else {
      updatedCart = [...cartItems, { ...product, quantity: qtyToAdd }];
    }

    saveCart(updatedCart);
    setSelectedProduct(null);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    const qty = Math.max(1, Number(newQty));
    const target =
      products?.find((p) => p.id === productId) ||
      cartItems.find((p) => p.id === productId);

    if (target?.stock !== undefined && qty > target.stock) {
      alert(`⚠️ Stock disponible : ${target.stock} ${target.unit || "kg"}.`);
      return;
    }

    saveCart(
      cartItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item,
      ),
    );
  };

  const handleRemoveItem = (productId) =>
    saveCart(cartItems.filter((item) => item.id !== productId));
  const handleClearCart = () => saveCart([]);

  // --- LOGIQUE STRICTE BASE DE DONNÉES ---
  // On s'assure que displayProducts est toujours un tableau (même si la BDD renvoie undefined le temps du chargement)
  const displayProducts = products || [];

  // Filtre tolérant pour pallier aux éventuelles différences de nommage dans Firebase (name vs title)
  const filteredProducts = displayProducts.filter((product) => {
    const productTitle = product.title || product.name || "";
    const matchesSearch = productTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesProducer =
      !selectedProducer || product.producer === selectedProducer;

    const isProductBio = Boolean(product.isBio || product.bio);
    const matchesBio = !onlyBio || isProductBio;

    return matchesSearch && matchesProducer && matchesBio;
  });

  const uniqueProducers = [
    ...new Set(displayProducts.map((p) => p.producer).filter(Boolean)),
  ];

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedProducer("");
    setOnlyBio(false);
  };

  const cartCount = cartItems.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0,
  );

  // Vue Panier
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

  // Vue Boutique Principale
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

      {/* État de chargement depuis la Base de données */}
      {loading && displayProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-green-700" size={32} />
          <p className="text-gray-500 text-sm font-medium">
            Synchronisation avec les maraîchers...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          Erreur de connexion à la base de données : {error}
        </div>
      )}

      {/* Affichage des produits de la base de données */}
      {!loading && !error && (
        <ProductGrid
          products={filteredProducts}
          onOpenDetails={setSelectedProduct}
          onResetFilters={handleResetFilters}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          products={displayProducts}
        />
      )}
    </div>
  );
}

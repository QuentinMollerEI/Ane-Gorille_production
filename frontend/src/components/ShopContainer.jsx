import React, { useState, useEffect } from "react";
import useProducts from "../hooks/useProducts";
import FilterBar from "./FilterBar";
import ProductGrid from "./ProductGrid";
import ProductDetailModal from "./ProductDetailModal";
import CartContainer from "../pages/boutique/components/CartContainer";
import { ShoppingBag, ChevronLeft } from "lucide-react";

/**
 * 🥬 COMPOSANT : ShopContainer.jsx (Version Optimisée & Connectée au Panier)
 * Responsabilité unique : Gérer la boutique de proximité, l'état local du panier
 * (avec persistance localStorage et synchronisation instantanée), et l'aiguillage
 * d'affichage entre la grille des récoltes et le grand panier de validation.
 */
export default function ShopContainer() {
  const { products, loading, error } = useProducts();

  // États d'affichage, de filtrage et de sélection
  const [currentView, setCurrentView] = useState("shop"); // 'shop' | 'cart'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState("");
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- 🛒 GESTION DU PANIER LOCAL AVEC PERSISTANCE ---
  const [cartItems, setCartItems] = useState([]);

  // Charger le panier depuis le localStorage au démarrage de la session
  useEffect(() => {
    const savedCart = localStorage.getItem("ane_gorille_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Erreur de lecture du panier local :", err);
      }
    }
  }, []);

  // Sauvegarder automatiquement le panier dès qu'il change
  const saveCart = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem("ane_gorille_cart", JSON.stringify(newItems));

    // Déclenche un événement global pour notifier d'autres composants (comme un Header/Navbar)
    window.dispatchEvent(new Event("cartUpdate"));
  };

  // 1. AJOUTER UN PRODUIT AU PANIER (Workflow Direct-to-Cart)
  const handleAddToCart = (product, quantity) => {
    const qtyToAdd = Number(quantity || 1);
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      const newQty =
        Number(
          updatedCart[existingIndex].quantity ||
            updatedCart[existingIndex].qty ||
            0,
        ) + qtyToAdd;

      // Sécurisation anti-dépassement de stock
      if (product.stock && newQty > product.stock) {
        alert(
          `⚠️ Désolé, le stock de ce maraîcher est limité à ${product.stock} kg.`,
        );
        return;
      }

      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: newQty,
        qty: newQty, // Double mappage pour parer à tout mismatch de variables
      };
    } else {
      updatedCart = [
        ...cartItems,
        {
          ...product,
          quantity: qtyToAdd,
          qty: qtyToAdd,
        },
      ];
    }

    saveCart(updatedCart);
    setSelectedProduct(null); // Ferme la modal de détail

    // 🚀 REDIRECTION INSTANTANÉE VERS LE GRAND PANIER (Expérience Simplifiée)
    setCurrentView("cart");
  };

  // 2. MODIFIER LA QUANTITÉ DEPUIS LE PANIER
  const handleUpdateQuantity = (productId, newQty) => {
    const qty = Math.max(1, Number(newQty));
    const targetProduct =
      products.find((p) => p.id === productId) ||
      cartItems.find((p) => p.id === productId);

    if (targetProduct && targetProduct.stock && qty > targetProduct.stock) {
      alert(
        `⚠️ Désolé, le stock disponible chez ce producteur est de ${targetProduct.stock} ${targetProduct.unit || "kg"}.`,
      );
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: qty, qty: qty } : item,
    );
    saveCart(updatedCart);
  };

  // 3. SUPPRIMER UN COLIS DU PANIER
  const handleRemoveItem = (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    saveCart(updatedCart);
  };

  // 4. VIDER ENTIÈREMENT LE PANIER
  const handleClearCart = () => {
    saveCart([]);
  };

  // --- 📊 LOGIQUE DE FILTRAGE DES PRODUITS ---
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
            batchNumber: "LOT-PDT-001",
            harvestDate: "02/09/2026",
            iduAdeme: "FR384920_01ECOR",
            distanceKm: "12",
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
            batchNumber: "LOT-CAR-042",
            harvestDate: "01/09/2026",
            iduAdeme: "FR384920_01ECOR",
            distanceKm: "12",
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
            batchNumber: "LOT-TOM-089",
            harvestDate: "31/08/2026",
            iduAdeme: "FR908123_01ECOR",
            distanceKm: "18",
            stock: 0,
            unit: "kg",
          },
          {
            id: 4,
            title: "Poireaux d'automne robustes",
            priceHT: 1.8,
            vatRate: 5.5,
            isAvailable: true,
            isBio: false,
            producer: "Le Jardin d'Émile",
            batchNumber: "LOT-POI-011",
            harvestDate: "02/09/2026",
            iduAdeme: "FR456789_01ECOR",
            distanceKm: "25",
            stock: 120,
            unit: "kg",
          },
          {
            id: 5,
            title: "Pommes Gala croquantes",
            priceHT: 3.32,
            vatRate: 5.5,
            isAvailable: true,
            isBio: true,
            producer: "Vergers de la Plaine",
            batchNumber: "LOT-PML-102",
            harvestDate: "30/08/2026",
            iduAdeme: "FR123456_01ECOR",
            distanceKm: "8",
            stock: 45,
            unit: "kg",
          },
        ];

  // Extraction dynamique des producteurs existants pour les filtres
  const uniqueProducers = [
    ...new Set(displayProducts.map((p) => p.producer).filter(Boolean)),
  ];

  // Filtrage combiné (Recherche + Producteur + Bio)
  const filteredProducts = displayProducts.filter((product) => {
    const matchesSearch = (product.title || product.name || "")
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

  // --- RENDU PANIER GRAND FORMAT ---
  if (currentView === "cart") {
    return (
      <div className="space-y-4">
        {/* En-tête de retour */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView("shop")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-700 font-bold uppercase transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            Retourner à la boutique
          </button>
          <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 border border-green-150 px-3 py-1 rounded-full">
            Panier Actif sécurisé
          </span>
        </div>

        {/* Le Grand Panier avec injection de toutes les propriétés d'états requises */}
        <CartContainer
          cartItems={cartItems}
          onClearCart={handleClearCart}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </div>
    );
  }

  // --- RENDU CATALOGUE / GRILLE BOUTIQUE ---
  return (
    <section
      id="shop-section"
      className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-8 animate-fade-in"
    >
      {/* En-tête de la boutique avec bouton d'accès au panier */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-brand-gold pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-green">
            Notre Boutique — Le Marché de Proximité
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
            Des produits frais récoltés pour votre énergie alimentaire
          </p>
        </div>

        {/* Bouton vers le Grand Panier */}
        <button
          onClick={() => setCurrentView("cart")}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-2.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm self-start md:self-auto"
        >
          <ShoppingBag size={16} />
          <span>Mon panier ({cartCount})</span>
        </button>
      </div>

      {/* Rendu de la barre de filtres */}
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

      {/* États de chargement et d'erreur */}
      {loading && products.length === 0 && (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-green"></div>
          <span className="text-brand-green font-bold text-xs uppercase tracking-wider">
            Chargement du marché...
          </span>
        </div>
      )}

      {error && products.length === 0 && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-center text-xs font-bold my-6"
          role="alert"
        >
          Oups ! Une erreur est survenue lors du chargement : {error}
        </div>
      )}

      {/* Grille d'affichage avec action d'ouverture de fiche */}
      {(!loading || products.length > 0) && (
        <ProductGrid
          products={filteredProducts}
          onOpenDetails={setSelectedProduct}
        />
      )}

      {/* Modal d'affichage complet de la Fiche de Traçabilité */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(product, qty) => handleAddToCart(product, qty)} // Liaison avec l'action d'ajout au panier !
        />
      )}
    </section>
  );
}

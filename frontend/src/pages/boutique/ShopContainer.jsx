import React, { useState, useEffect } from "react";
import { ShoppingCart, Store, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";

import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import FilterBar from "./components/FilterBar";
import CartContainer from "./components/CartContainer";
import ProducerStorePage from "./components/ProducerStorePage";

export default function ShopContainer({ products: propsProducts, usersMap: propsUsersMap }) {
  const { user } = useAuth();

  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [activeView, setActiveView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducerId, setSelectedProducerId] = useState(null);

  // Filtres & Tri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isBioOnly, setIsBioOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedDept, setSelectedDept] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (e) {
      console.error("Erreur sauvegarde panier :", e);
    }
  }, [cart, cartKey]);

  useEffect(() => {
    if (propsUsersMap && Object.keys(propsUsersMap).length > 0) {
      setUsersMap(propsUsersMap);
      return;
    }
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data();
        });
        setUsersMap(map);
      },
      (error) => {
        console.warn("Accès collection 'users' restreint.");
      }
    );
    return () => unsubscribeUsers();
  }, [propsUsersMap]);

  useEffect(() => {
    if (propsProducts && propsProducts.length > 0) {
      setProductsList(propsProducts);
      setLoading(false);
      return;
    }
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const raw = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProductsList(raw);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lecture produits :", error.message);
        setLoading(false);
      }
    );
    return () => unsubscribeProducts();
  }, [propsProducts]);

  const activeProducts = propsProducts && propsProducts.length > 0 ? propsProducts : productsList;
  const activeUsersMap = propsUsersMap && Object.keys(propsUsersMap).length > 0 ? propsUsersMap : usersMap;

  // Enrichissement dynamique
  const enrichedProducts = activeProducts.map((p) => {
    const producerId = p.producerId || p.userId || p.ownerId;
    const profile = activeUsersMap[producerId] || {};
    const postalCode = p.producerPostalCode || profile.postalCode || profile.codePostal || profile.zipCode || "";
    
    const cleanPostalDigits = String(postalCode).replace(/\D/g, "");
    let department = null;
    if (cleanPostalDigits.length >= 2) {
      department = cleanPostalDigits.substring(0, 2);
    } else if (typeof p.producerDepartment === "string" && /^\d{2}$/.test(p.producerDepartment.trim())) {
      department = p.producerDepartment.trim();
    }

    return {
      ...p,
      producerCompany: p.producerCompany || p.companyName || profile.companyName || profile.displayName || "Exploitation",
      producerAddress: p.producerAddress || profile.address || "",
      producerCity: p.producerCity || profile.city || "",
      producerPostalCode: postalCode,
      producerDepartment: department,
    };
  });

  const visibleProducts = enrichedProducts.filter((p) => {
    const isHidden = p.isHidden === true || p.status === "hidden" || p.status === "draft" || p.isPublished === false || p.isMasked === true;
    return !isHidden;
  });

  const availableDepartments = Array.from(
    new Set(
      visibleProducts
        .map((p) => p.producerDepartment)
        .filter((dept) => dept && /^\d{2}$/.test(dept))
    )
  ).sort();

  const availableCategories = Array.from(
    new Set(
      visibleProducts
        .map((p) => p.category)
        .filter((cat) => Boolean(cat))
    )
  ).map((cat) => ({ id: cat, label: cat }));

  // 1. Filtrage des produits
  const filteredProducts = visibleProducts.filter((p) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (p.title || p.name || "").toLowerCase().includes(term);
      const matchProducer = (p.producerCompany || p.producerName || "").toLowerCase().includes(term);
      const matchCity = (p.producerCity || "").toLowerCase().includes(term);
      if (!matchTitle && !matchProducer && !matchCity) return false;
    }

    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (isBioOnly && !p.isBio) return false;
    if (selectedDept !== "all" && p.producerDepartment !== selectedDept) return false;

    if (favoritesOnly) {
      const favList = user?.favoriteProducers || [];
      if (!favList.includes(p.producerId)) return false;
    }

    return true;
  });

  // 2. Tri des produits filtrés
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = Number(a?.priceHT ?? a?.price ?? 0);
    const priceB = Number(b?.priceHT ?? b?.price ?? 0);
    const stockA = Number(a?.stock ?? 0);
    const stockB = Number(b?.stock ?? 0);

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "stock-desc") return stockB - stockA;
    if (sortBy === "name-asc") return (a.title || a.name || "").localeCompare(b.title || b.name || "");
    return 0;
  });

  const handleAddToCart = (product, quantityToAdd = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantityToAdd;
        return updated;
      }
      return [...prevCart, { ...product, quantity: quantityToAdd }];
    });

    setNotification(`"${product.title || product.name}" ajouté au panier !`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(cartKey);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setActiveView("detail");
  };

  const handleOpenProducerStore = (producerId) => {
    setSelectedProducerId(producerId);
    setActiveView("producer_store");
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (loading && activeProducts.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <Loader2 className="animate-spin text-emerald-700" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* En-tête Panier */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Marché Local & Pro</h1>
          <p className="text-xs text-gray-500 font-medium">Récoltes en circuit court certifiées Âne & Gorille</p>
        </div>

        <button
          onClick={() => setActiveView(activeView === "cart" ? "grid" : "cart")}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-sm cursor-pointer ${
            activeView === "cart"
              ? "bg-emerald-800 hover:bg-emerald-900 text-white"
              : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          {activeView === "cart" ? (
            <>
              <Store size={18} />
              <span>Continuer mes achats</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Mon Panier ({totalCartCount})</span>
            </>
          )}
        </button>
      </div>

      {/* Vues */}
      {activeView === "grid" && (
        <div className="space-y-6">
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isBioOnly={isBioOnly}
            setIsBioOnly={setIsBioOnly}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={availableCategories}
            departments={availableDepartments}
          />
          <ProductGrid
            products={sortedProducts}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
          />
        </div>
      )}

      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={visibleProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleSelectProduct}
          onOpenProducerStore={handleOpenProducerStore}
        />
      )}

      {activeView === "producer_store" && selectedProducerId && (
        <ProducerStorePage
          producerId={selectedProducerId}
          producerProfile={activeUsersMap[selectedProducerId]}
          products={visibleProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBackToShop={() => setActiveView("grid")}
        />
      )}
    </div>
  );
}
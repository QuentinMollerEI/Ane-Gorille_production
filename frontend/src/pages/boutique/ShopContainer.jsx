import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import { CheckCircle } from "lucide-react";

// Liste officielle des 7 catégories d'ajout de produit
const OFFICIAL_CATEGORIES = [
  "Légumes",
  "Fruits",
  "Herbes",
  "Miel & Apiculture",
  "Œufs & Élevage",
  "Produits Secs & Épicerie",
  "Produits Transformés & Conserves"
];

export default function ShopContainer({ activeView: propActiveView, setActiveView: propSetActiveView }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Synchronisation dynamique de la vue (grid / detail / cart)
  const [internalActiveView, setInternalActiveView] = useState("grid");
  const activeView = propActiveView || internalActiveView;

  const setActiveView = (view) => {
    if (propSetActiveView) {
      propSetActiveView(view);
    }
    setInternalActiveView(view);
  };

  // 🔄 ÉCOUTE DYNAMIQUE DES CLICS NAVBAR VIA L'URL (?view=cart, ?tab=panier, ?view=grid, etc.)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view") || params.get("tab") || params.get("activeView") || params.get("module");
    if (viewParam === "cart" || viewParam === "panier") {
      setInternalActiveView("cart");
    } else if (viewParam === "grid" || viewParam === "boutique" || viewParam === "shop") {
      setInternalActiveView("grid");
    }
  }, [location.search]);

  // =========================================================================
  // ÉTATS DE FILTRAGE ET DE TRI SYNCHRONISÉS AVEC FILTERBAR
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isBioOnly, setIsBioOnly] = useState(false);
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedDept, setSelectedDept] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [selectedProduct, setSelectedProduct] = useState(null);

  // =========================================================================
  // GESTION DES FOURNISSEURS FAVORIS (localStorage)
  // =========================================================================
  const favKey = user?.uid ? `ane_gorille_fav_producers_${user.uid}` : "ane_gorille_fav_producers_guest";
  const [favoriteProducers, setFavoriteProducers] = useState(() => {
    try {
      const savedFavs = localStorage.getItem(favKey);
      return savedFavs ? JSON.parse(savedFavs) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(favKey, JSON.stringify(favoriteProducers));
    } catch (e) {
      console.error(e);
    }
  }, [favoriteProducers, favKey]);

  const toggleFavoriteProducer = (producerId) => {
    if (!producerId) return;
    setFavoriteProducers((prev) => {
      const isFav = prev.includes(producerId);
      const updated = isFav ? prev.filter((id) => id !== producerId) : [...prev, producerId];
      setNotification(isFav ? "Fournisseur retiré de vos favoris." : "Fournisseur ajouté à vos favoris !");
      setTimeout(() => setNotification(null), 2500);
      return updated;
    });
  };

  // =========================================================================
  // GESTION DU PANIER INDIVIDUEL (Cloisonné par UID utilisateur)
  // =========================================================================
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
    if (cartKey !== "ane_gorille_cart_guest") {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, cartKey]);

  // Synchronisation des producteurs
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.docs.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      setUsersMap(map);
    });
    return () => unsubUsers();
  }, []);

  // Synchronisation du catalogue de produits
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const raw = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProductsList(raw);
      setLoading(false);
    });
    return () => unsubProducts();
  }, []);

  // Extraction stricte de 2 chiffres numériques du code postal pour les départements
  const enrichedProducts = useMemo(() => {
    return productsList
      .map((p) => {
        const producerId = p.producerId || p.userId || p.ownerId;
        const profile = usersMap[producerId] || {};
        const rawPostal = String(profile.postalCode || profile.codePostal || profile.zipCode || p.producerPostalCode || p.postalCode || "").trim();
        const digitsOnly = rawPostal.replace(/\D/g, "");
        
        let dept = "";
        if (digitsOnly.length >= 2) {
          dept = digitsOnly.substring(0, 2);
        } else if (p.producerDepartment && /^\d{2,3}\$/.test(String(p.producerDepartment).trim())) {
          dept = String(p.producerDepartment).trim().substring(0, 2);
        } else if (p.department && /^\d{2,3}\$/.test(String(p.department).trim())) {
          dept = String(p.department).trim().substring(0, 2);
        } else {
          dept = "31";
        }

        return {
          ...p,
          producerId,
          producerCompany: p.producerCompany || p.companyName || profile.companyName || profile.displayName || "Exploitation Locale",
          producerAddress: p.producerAddress || profile.address || "Adresse renseignée en profil",
          producerCity: p.producerCity || profile.city || "Commune locale",
          producerPostalCode: rawPostal,
          producerDepartment: dept,
        };
      })
      .filter((p) => !(p.isHidden || p.status === "hidden" || p.status === "draft" || p.isMasked));
  }, [productsList, usersMap]);

  // Catégories disponibles
  const availableCategories = useMemo(() => {
    const cats = new Set(enrichedProducts.map((p) => p.category).filter(Boolean));
    OFFICIAL_CATEGORIES.forEach((cat) => cats.add(cat));
    return Array.from(cats);
  }, [enrichedProducts]);

  // Départements à 2 chiffres
  const availableDepartments = useMemo(() => {
    const depts = new Set(
      enrichedProducts
        .map((p) => String(p.producerDepartment).replace(/\D/g, "").substring(0, 2))
        .filter((d) => d.length === 2)
    );
    return Array.from(depts).sort();
  }, [enrichedProducts]);

  // Filtrage et Tri
  const filteredProducts = useMemo(() => {
    const activeSearch = (searchTerm || searchQuery || "").trim().toLowerCase();
    const isBioRequested = selectedLabel === "isBio" || isBioOnly || onlyBio;

    let result = enrichedProducts.filter((p) => {
      if (activeSearch) {
        const matchesTitle = (p.title || p.name || "").toLowerCase().includes(activeSearch);
        const matchesProducer = (p.producerCompany || "").toLowerCase().includes(activeSearch);
        const matchesCity = (p.producerCity || "").toLowerCase().includes(activeSearch);
        const matchesDept = (p.producerDepartment || "").toLowerCase().includes(activeSearch);
        const matchesCategory = (p.category || "").toLowerCase().includes(activeSearch);
        if (!matchesTitle && !matchesProducer && !matchesCity && !matchesDept && !matchesCategory) {
          return false;
        }
      }

      if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "") {
        if (p.category !== selectedCategory) return false;
      }

      if (selectedDept && selectedDept !== "all" && selectedDept !== "") {
        if (p.producerDepartment !== selectedDept) return false;
      }

      if (isBioRequested && !p.isBio) return false;

      if (favoritesOnly && !favoriteProducers.includes(p.producerId)) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      const stockA = Number(a.stock ?? 0);
      const stockB = Number(b.stock ?? 0);
      const priceA = Number(a.priceHT ?? a.price ?? 0);
      const priceB = Number(b.priceHT ?? b.price ?? 0);

      if (sortBy === "stock-desc") return stockB - stockA;
      if (sortBy === "stock-asc") return stockA - stockB;
      if (sortBy === "price-asc" || sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price-desc" || sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "name-asc" || sortBy === "name_asc") {
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      }
      if (sortBy === "date-desc" || sortBy === "newest") {
        const dateA = a.createdAt?.seconds || new Date(a.harvestDate || 0).getTime();
        const dateB = b.createdAt?.seconds || new Date(b.harvestDate || 0).getTime();
        return dateB - dateA;
      }

      const hasStockA = stockA > 0 ? 1 : 0;
      const hasStockB = stockB > 0 ? 1 : 0;
      if (hasStockA !== hasStockB) return hasStockB - hasStockA;
      return stockB - stockA;
    });

    return result;
  }, [
    enrichedProducts,
    searchTerm,
    searchQuery,
    selectedCategory,
    selectedDept,
    selectedLabel,
    isBioOnly,
    onlyBio,
    favoritesOnly,
    favoriteProducers,
    sortBy,
  ]);

  // Actions Panier
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
    if (newQty <= 0) return handleRemoveFromCart(productId);
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

  const handleBackToShop = () => {
    setActiveView("grid");
    if (location.search.includes("view=cart") || location.search.includes("tab=panier")) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete("view");
      searchParams.delete("tab");
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* VUE PANIER (Activable depuis la Navbar ou l'URL) */}
      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBackToShop={handleBackToShop}
        />
      )}

      {/* VUE FICHE PRODUIT DÉTAILLÉE */}
      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={enrichedProducts}
          onBack={handleBackToShop}
          onAddToCart={handleAddToCart}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {/* VUE CATALOGUE & BARRE DE FILTRES */}
      {activeView === "grid" && (
        <div className="space-y-6">
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isBioOnly={isBioOnly}
            setIsBioOnly={setIsBioOnly}
            onlyBio={onlyBio}
            setOnlyBio={setOnlyBio}
            selectedLabel={selectedLabel}
            setSelectedLabel={setSelectedLabel}
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
            products={filteredProducts}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveView("detail");
            }}
            onAddToCart={handleAddToCart}
            favoriteProducers={favoriteProducers}
            onToggleFavoriteProducer={toggleFavoriteProducer}
          />
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import ProducerStorePage from "./components/ProducerStorePage";
import { ShoppingCart, Store, CheckCircle } from "lucide-react";

export default function ShopContainer({ products: propsProducts, usersMap: propsUsersMap }) {
  const { user } = useAuth();

  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState(propsUsersMap || {});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);
  const [selectedDept, setSelectedDept] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Vues : 'grid' | 'detail' | 'cart' | 'producer_store'
  const [activeView, setActiveView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducerId, setSelectedProducerId] = useState(null);

  // Panier cloisonné par utilisateur
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [cart, setCart] = useState(() => {
    if (!user?.uid && cartKey.includes("guest")) return [];
    try {
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (user?.uid) {
      try {
        localStorage.setItem(cartKey, JSON.stringify(cart));
      } catch (e) {
        console.error("Erreur sauvegarde panier :", e);
      }
    }
  }, [cart, user?.uid, cartKey]);

  // Écoute de la collection `users` avec gestion d'erreur sécurisée
  useEffect(() => {
    if (propsUsersMap && Object.keys(propsUsersMap).length > 0) {
      setUsersMap(propsUsersMap);
      return;
    }

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((docSnap) => { map[docSnap.id] = docSnap.data(); });
        setUsersMap(map);
      },
      (error) => {
        // Capture l'erreur de permission sans interrompre le rendu
        console.warn("Lecture restreinte de la collection users :", error.message);
      }
    );

    return () => unsubscribeUsers();
  }, [propsUsersMap]);

  // Écoute des produits
  useEffect(() => {
    if (propsProducts && propsProducts.length > 0) {
      setProductsList(propsProducts);
      setLoading(false);
      return;
    }

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const raw = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setProductsList(raw);
        setLoading(false);
      },
      (error) => {
        console.warn("Erreur lecture produits :", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribeProducts();
  }, [propsProducts]);

  const activeProducts = propsProducts && propsProducts.length > 0 ? propsProducts : productsList;
  const activeUsersMap = propsUsersMap && Object.keys(propsUsersMap).length > 0 ? propsUsersMap : usersMap;

  // Enrichissement des produits avec les données du producteur
  const enrichedProducts = activeProducts.map((p) => {
    const producerId = p.producerId || p.userId || p.ownerId;
    const profile = activeUsersMap[producerId] || {};

    const rawPostalCode = p.producerPostalCode || profile.postalCode || profile.codePostal || profile.zipCode || "";
    const cleanDigits = String(rawPostalCode).replace(/\D/g, "");

    let deptCode = null;
    if (cleanDigits.length >= 2) {
      deptCode = cleanDigits.substring(0, 2);
    } else if (typeof p.producerDepartment === "string" && /^\d{2}$/.test(p.producerDepartment.trim())) {
      deptCode = p.producerDepartment.trim();
    }

    return {
      ...p,
      producerCompany: p.producerCompany || p.companyName || profile.companyName || profile.displayName || "Exploitation Locale",
      producerAddress: p.producerAddress || profile.address || "Adresse enregistrée au registre",
      producerCity: p.producerCity || profile.city || "Commune locale",
      producerPostalCode: rawPostalCode,
      producerDepartment: deptCode,
    };
  });

  const visibleProducts = enrichedProducts.filter((p) => !p.isHidden && p.status !== "hidden" && p.status !== "draft" && p.isPublished !== false && !p.isMasked);

  const availableCategories = Array.from(new Set(visibleProducts.map((p) => p.category).filter(Boolean))).map((cat) => ({ id: cat, label: cat }));
  const availableDepartments = Array.from(new Set(visibleProducts.map((p) => p.producerDepartment).filter((d) => d && /^\d{2}$/.test(d)))).sort();

  const filteredProducts = visibleProducts.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || (p.title || p.name || "").toLowerCase().includes(query) || (p.producerCompany || "").toLowerCase().includes(query) || (p.producerCity || "").toLowerCase().includes(query);
    const matchesCategory = !selectedCategory || selectedCategory === "all" || selectedCategory === "" || p.category === selectedCategory;
    const matchesDept = !selectedDept || selectedDept === "all" || selectedDept === "" || (p.producerDepartment && String(p.producerDepartment) === String(selectedDept));

    let matchesLabel = true;
    if (selectedLabel && selectedLabel !== "all") {
      matchesLabel = Boolean(p[selectedLabel]);
    } else if (bioOnly) {
      matchesLabel = Boolean(p.isBio);
    }

    let matchesFavorites = true;
    if (favoritesOnly) {
      const favList = user?.favoriteProducers || [];
      matchesFavorites = favList.includes(p.producerId);
    }

    return matchesSearch && matchesCategory && matchesDept && matchesLabel && matchesFavorites;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = Number(a?.priceHT ?? a?.price ?? 0);
    const priceB = Number(b?.priceHT ?? b?.price ?? 0);
    const stockA = Number(a?.stock ?? 0);
    const stockB = Number(b?.stock ?? 0);

    if (sortBy === "priceAsc" || sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "priceDesc" || sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "stockDesc" || sortBy === "stock-desc") return stockB - stockA;
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
    if (newQty <= 0) return handleRemoveFromCart(productId);
    setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item)));
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    try { localStorage.removeItem(cartKey); } catch (e) { console.error(e); }
  };

  // 🚀 Redirection vers la vitrine dédiée du producteur
  const handleOpenProducerStore = (producerId) => {
    const targetId = producerId || selectedProduct?.producerId || selectedProduct?.userId;
    if (targetId) {
      setSelectedProducerId(targetId);
      setActiveView("producer_store");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleFavorite = async (producerId) => {
    if (!user?.uid) return;
    const currentFavs = user?.favoriteProducers || [];
    const updatedFavs = currentFavs.includes(producerId)
      ? currentFavs.filter((id) => id !== producerId)
      : [...currentFavs, producerId];

    try {
      await updateDoc(doc(db, "users", user.uid), { favoriteProducers: updatedFavs });
    } catch (err) {
      console.error("Erreur favoris :", err);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (loading && activeProducts.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 text-xs">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* En-tête épuré et ultra-affiné avec touche Jaune Énergie */}
<div className="bg-white border border-amber-200/60 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden">
  
  {/* Liseré supérieur ultra-fin (2px) */}
  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300" />

  {/* Section Titre & Badge */}
  <div className="flex items-center gap-3">
    
    {/* Icône au cerclage épuré et trait fin */}
    <div className="w-9 h-9 bg-amber-400/15 border border-amber-300/50 text-amber-950 rounded-xl flex items-center justify-center shrink-0">
      <Store size={18} className="stroke-[1.4]" />
    </div>

    <div className="space-y-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-sm font-bold text-gray-900 tracking-tight">
          Boutique &amp; Approvisionnement
        </h1>
        {/* Badge discret au contour délié */}
        <span className="bg-amber-50 border border-amber-200/60 text-amber-900 font-medium text-[9px] px-2 py-0.5 rounded-full tracking-wide flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
          Énergie Locale
        </span>
      </div>
      <p className="text-[11px] text-gray-500 font-normal">
        Circuit court en direct des exploitations maraîchères certifiées
      </p>
    </div>
  </div>

  {/* Bouton d'Action Dynamique Haute Définition */}
<button
  type="button"
  onClick={() => setActiveView(activeView === "cart" ? "grid" : "cart")}
  className={`relative group px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer border active:scale-[0.97] ${
    activeView === "cart"
      ? "bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-amber-950 border-amber-300/70 shadow-[0_2px_12px_rgba(251,191,36,0.25)] hover:shadow-[0_4px_16px_rgba(251,191,36,0.4)] hover:border-yellow-200"
      : "bg-emerald-950 hover:bg-emerald-900 text-emerald-100 border-emerald-800/60 shadow-2xs hover:shadow-md"
  }`}
>
  {activeView === "cart" ? (
    <>
      <Store size={14} className="stroke-[1.4] text-amber-950 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span className="font-extrabold tracking-tight">Continuer mes achats</span>
    </>
  ) : (
    <>
      <ShoppingCart size={14} className="stroke-[1.4] text-emerald-300 transition-transform duration-300 group-hover:scale-110" />
      <span className="font-extrabold tracking-tight">Mon Panier</span>
      {totalCartCount > 0 && (
        <span className="ml-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs border border-yellow-200/60">
          {totalCartCount}
        </span>
      )}
    </>
  )}
</button>

</div>

      {/* VUE PANIER */}
      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBackToShop={() => setActiveView("grid")}
        />
      )}

      {/* VUE FICHE DÉTAILLÉE PRODUIT */}
      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={visibleProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenProducerStore={handleOpenProducerStore}
        />
      )}

      {/* VUE VITRINE PRODUCTEUR */}
      {activeView === "producer_store" && selectedProducerId && (
        <ProducerStorePage
          producerId={selectedProducerId}
          producerProfile={activeUsersMap[selectedProducerId]}
          products={visibleProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            setActiveView("detail");
          }}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* VUE CATALOGUE GÉNÉRAL */}
      {activeView === "grid" && (
        <div className="space-y-4">
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchQuery={searchTerm}
            setSearchQuery={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedLabel={selectedLabel}
            setSelectedLabel={setSelectedLabel}
            onlyBio={bioOnly}
            setOnlyBio={setBioOnly}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={availableCategories}
            departments={availableDepartments}
          />

          <ProductGrid
            products={sortedProducts}
            onSelectProduct={(product) => {
              setSelectedProduct(product);
              setActiveView("detail");
            }}
            onAddToCart={handleAddToCart}
            onOpenProducerStore={handleOpenProducerStore}
          />
        </div>
      )}
    </div>
  );
}
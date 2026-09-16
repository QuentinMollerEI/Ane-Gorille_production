import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import ProducerStorePage from "./components/ProducerStorePage";
import { CheckCircle } from "lucide-react";

export default function ShopContainer() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  // Vues : 'grid' | 'detail' | 'cart' | 'producer_store'
  const [activeView, setActiveView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducerId, setSelectedProducerId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam === "cart") {
      setActiveView("cart");
    } else if (viewParam === "grid") {
      setActiveView("grid");
    }
  }, [location.search]);

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

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.docs.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      setUsersMap(map);
    });
    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const raw = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProductsList(raw);
      setLoading(false);
    });
    return () => unsubscribeProducts();
  }, []);

  const enrichedProducts = productsList
    .map((p) => {
      const producerId = p.producerId || p.userId || p.ownerId;
      const profile = usersMap[producerId] || {};
      const postalCode = profile.postalCode || profile.codePostal || profile.zipCode || "";
      const companyName =
        p.producerCompany ||
        p.producerName ||
        p.companyName ||
        p.producer ||
        profile.companyName ||
        profile.displayName ||
        "Exploitation Locale";

      return {
        ...p,
        producerCompany: companyName,
        producerName: companyName,
        producerDepartment: p.producerDepartment || (postalCode ? postalCode.substring(0, 2) : "31"),
      };
    })
    .filter((p) => !(p.isHidden || p.status === "hidden" || p.status === "draft" || p.isMasked));

  const filteredProducts = enrichedProducts.filter((p) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (p.title || p.name || "").toLowerCase().includes(query) ||
      (p.producerCompany || "").toLowerCase().includes(query) ||
      (p.producerName || "").toLowerCase().includes(query);

    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesBio = !bioOnly || p.isBio === true;

    return matchesSearch && matchesCategory && matchesBio;
  });

  const handleAddToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.findIndex((item) => item.id === product.id);
      if (existing > -1) {
        const updated = [...prev];
        updated[existing].quantity += qty;
        return updated;
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setNotification(`"${product.title || product.name}" ajouté au panier !`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) return setCart((prev) => prev.filter((item) => item.id !== id));
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
  };

  // 🚀 LIAISON : Bascule directement vers la page vitrine du producteur
  const handleOpenProducerStore = (producerId) => {
    if (producerId) {
      setSelectedProducerId(producerId);
      setActiveView("producer_store");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* VUE PANIER */}
      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={(id) => setCart((prev) => prev.filter((item) => item.id !== id))}
          onClearCart={() => {
            setCart([]);
            localStorage.removeItem(cartKey);
          }}
          onBackToShop={() => {
            setActiveView("grid");
            navigate("/dashboard?module=boutique&view=grid");
          }}
        />
      )}

      {/* VUE DÉTAIL D'UN PRODUIT */}
      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={enrichedProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={setSelectedProduct}
          onOpenProducerStore={handleOpenProducerStore}
        />
      )}

      {/* VUE PAGE VITRINE DU PRODUCTEUR */}
      {activeView === "producer_store" && selectedProducerId && (
        <ProducerStorePage
          producerId={selectedProducerId}
          producerProfile={usersMap[selectedProducerId] || {}}
          products={enrichedProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            setActiveView("detail");
          }}
        />
      )}

      {/* VUE GRILLE GÉNÉRALE DU CATALOGUE */}
      {activeView === "grid" && (
        <div className="space-y-6">
          <FilterBar
            searchQuery={searchTerm}
            setSearchQuery={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onlyBio={bioOnly}
            setOnlyBio={setBioOnly}
          />
          <ProductGrid
            products={filteredProducts}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveView("detail");
            }}
            onAddToCart={handleAddToCart}
          />
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import { ShoppingCart, Store, CheckCircle2, X } from "lucide-react";

/**
 * 🛒 COMPOSANT : ShopContainer.jsx
 * Emplacement : src/pages/Boutique/ShopContainer.jsx
 * Contrôleur central du catalogue et du panier avec synchronisation événementielle instantanée.
 */
export default function ShopContainer() {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialViewParam = params.get("view"); // 'cart' | 'grid' | 'detail'

  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Notification flottante d'ajout au panier
  const [addedNotification, setAddedNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  // Gestion de la vue active
  const [activeView, setActiveView] = useState(() => {
    return initialViewParam === "cart" ? "cart" : "grid";
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Écoute des changements de paramètres d'URL (ex: ?view=cart)
  useEffect(() => {
    const currentViewParam = new URLSearchParams(location.search).get("view");
    if (currentViewParam === "cart") {
      setActiveView("cart");
    } else if (currentViewParam === "grid") {
      setActiveView("grid");
    }
  }, [location.search]);

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  // Initialisation réactive du panier
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  // 1. RECHARGEMENT DU PANIER DÈS QUE L'UTILISATEUR SE CONNECTE OU CHANGE DE COMPTE
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch (e) {
      console.error("Erreur rechargement panier localStorage :", e);
    }
  }, [cartKey, user?.uid]);

  // 2. SYNCHRONISATION ÉVÉNEMENTIELLE INSTANTANÉE EN TEMPS RÉEL (CUSTOM EVENT + STORAGE)
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (e) {
        console.error("Erreur sync événementuelle panier :", e);
      }
    };

    const handleOpenCartEvent = () => {
      setActiveView("cart");
    };

    const handleViewChangeEvent = (e) => {
      if (e && e.detail && e.detail.view) {
        setActiveView(e.detail.view);
      }
    };

    window.addEventListener("ane_gorille_cart_updated", handleCartSync);
    window.addEventListener("ane_gorille_open_cart", handleOpenCartEvent);
    window.addEventListener("ane_gorille_view_changed", handleViewChangeEvent);
    window.addEventListener("storage", handleCartSync);

    return () => {
      window.removeEventListener("ane_gorille_cart_updated", handleCartSync);
      window.removeEventListener("ane_gorille_open_cart", handleOpenCartEvent);
      window.removeEventListener("ane_gorille_view_changed", handleViewChangeEvent);
      window.removeEventListener("storage", handleCartSync);
    };
  }, [cartKey]);

  // 3. FONCTION COMMUNE DE DIFFUSION DES MUTATIONS PANIER
  const broadcastCartChange = (updatedCart) => {
    setCart(updatedCart);
    try {
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent("ane_gorille_cart_updated", { detail: { cart: updatedCart } }));
    } catch (e) {
      console.error("Erreur écriture panier :", e);
    }
  };

  // Synchronisation des producteurs
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

  // Synchronisation du catalogue produits
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

  // Enrichissement et exclusion des produits masqués
  const enrichedProducts = productsList.map((p) => {
    const producerId = p.producerId || p.userId || p.ownerId;
    const profile = usersMap[producerId] || {};
    const postalCode = profile.postalCode || profile.codePostal || profile.zipCode || "";
    return {
      ...p,
      producerCompany: p.producerCompany || p.companyName || profile.companyName || profile.displayName || "Exploitation Locale",
      producerAddress: p.producerAddress || profile.address || "Adresse renseignée en profil",
      producerCity: p.producerCity || profile.city || "Commune locale",
      producerPostalCode: postalCode,
      producerDepartment: p.producerDepartment || (postalCode ? postalCode.substring(0, 2) : "31"),
    };
  }).filter((p) => !(p.isHidden || p.status === "hidden" || p.status === "draft" || p.isMasked));

  const filteredProducts = enrichedProducts.filter((p) => {
    const matchesSearch =
      (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.producerCompany || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesBio = !bioOnly || p.isBio === true;
    return matchesSearch && matchesCategory && matchesBio;
  });

  // 🚀 AJOUT AU PANIER AVEC VISUEL INTUITIF ET SYNCHRONISATION INSTANTANÉE
  const handleAddToCart = (product, qty = 1) => {
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    let updatedCart = [];

    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: (updatedCart[existingIndex].quantity || 1) + qty
      };
    } else {
      updatedCart = [...cart, { ...product, quantity: qty }];
    }

    broadcastCartChange(updatedCart);

    // Visuel de confirmation intuitif
    const newTotal = updatedCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    setAddedNotification({
      productTitle: product.title || product.name || "Produit",
      totalCount: newTotal
    });

    setTimeout(() => {
      setAddedNotification(null);
    }, 4000);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      return handleRemoveFromCart(productId);
    }
    const updatedCart = cart.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item));
    broadcastCartChange(updatedCart);
  };

  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    broadcastCartChange(updatedCart);
  };

  const handleClearCart = () => {
    broadcastCartChange([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-xs font-sans text-slate-800 relative">
      
      {/* 🟢 VISUEL DE CONFIRMATION D'AJOUT AU PANIER (BARRE FLOTTANTE DISCRÈTE) */}
      {addedNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-extrabold text-xs leading-tight">
                "{addedNotification.productTitle}" ajouté au panier !
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {addedNotification.totalCount} article{addedNotification.totalCount > 1 ? "s" : ""} dans votre panier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView("cart")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            Voir Panier
          </button>
          <button
            type="button"
            onClick={() => setAddedNotification(null)}
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VUE CONDITIONNELLE : PANIER */}
      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBackToShop={() => setActiveView("grid")}
        />
      )}

      {/* VUE CONDITIONNELLE : FICHE PRODUIT DÉTAILLÉE */}
      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={enrichedProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {/* VUE CONDITIONNELLE : GRILLE DU CATALOGUE */}
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

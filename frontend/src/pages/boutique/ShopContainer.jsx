import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";

/**
 * 🛒 COMPOSANT : ShopContainer.jsx
 * Emplacement : src/pages/Boutique/ShopContainer.jsx
 * Contrôleur central du catalogue et du panier avec synchronisation événementielle instantanée.
 */
export default function ShopContainer() {
  const { user } = useAuth();
  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  const [activeView, setActiveView] = useState("grid"); // 'grid' | 'detail' | 'cart'
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  // 2. SYNCHRONISATION ÉVÉNEMENTIELLE INSTANTANÉE ET BASCULE DE VUE VIA NAVBAR
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

    const handleOpenCart = () => setActiveView("cart");
    const handleViewChange = (e) => {
      if (e?.detail?.view) {
        setActiveView(e.detail.view);
      }
    };

    window.addEventListener("ane_gorille_cart_updated", handleCartSync);
    window.addEventListener("ane_gorille_open_cart", handleOpenCart);
    window.addEventListener("ane_gorille_view_changed", handleViewChange);
    window.addEventListener("storage", handleCartSync);

    return () => {
      window.removeEventListener("ane_gorille_cart_updated", handleCartSync);
      window.removeEventListener("ane_gorille_open_cart", handleOpenCart);
      window.removeEventListener("ane_gorille_view_changed", handleViewChange);
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

  // 🚀 AJOUT AU PANIER AVEC MISE À JOUR INSTANTANÉE
  const handleAddToCart = (product, qty = 1) => {
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    let updatedCart = [];

    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + qty
      };
    } else {
      updatedCart = [...cart, { ...product, quantity: qty }];
    }

    broadcastCartChange(updatedCart);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-xs font-sans text-slate-800">
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

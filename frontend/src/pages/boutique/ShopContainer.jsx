import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import { CheckCircle } from "lucide-react";

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
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  const [activeView, setActiveView] = useState("grid"); // 'grid' | 'detail' | 'cart'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Clé de stockage unique par utilisateur (cloisonnement RGPD)
  const cartKey = user?.uid ? "ane_gorille_cart_" + user.uid : "ane_gorille_cart_guest";

  // Initialisation réactive du panier
  const [cart, setCart] = useState(function () {
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

    window.addEventListener("ane_gorille_cart_updated", handleCartSync);
    window.addEventListener("storage", handleCartSync);

    return () => {
      window.removeEventListener("ane_gorille_cart_updated", handleCartSync);
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

  // 🚀 AJOUT AU PANIER AVEC MISE À JOUR INSTANTANÉE DU COMPTEUR
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
    setNotification({
      title: product.title || product.name || "Produit",
      qty: qty
    });
    setTimeout(() => setNotification(null), 4000);
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

  // 4. ÉCOUTEUR D'ÉVÉNEMENTS POUR LA BASCULE DE VUE / OUVERTURE DU PANIER DEPUIS CARTBUTTON
  useEffect(() => {
    const handleOpenCart = () => setActiveView("cart");
    const handleViewChange = (e) => {
      if (e?.detail?.view) {
        setActiveView(e.detail.view);
      }
    };

    window.addEventListener("ane_gorille_open_cart", handleOpenCart);
    window.addEventListener("ane_gorille_view_changed", handleViewChange);

    return () => {
      window.removeEventListener("ane_gorille_open_cart", handleOpenCart);
      window.removeEventListener("ane_gorille_view_changed", handleViewChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-xs font-sans text-slate-800">
      {/* Toast Notification Visuelle d'ajout au panier */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 flex items-center gap-4 animate-fade-in max-w-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
              Ajouté au panier !
            </p>
            <p className="font-bold text-xs text-white truncate mt-0.5">
              {notification.title}
            </p>
          </div>
          <button
            onClick={() => {
              setActiveView("cart");
              setNotification(null);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Voir panier
          </button>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1 font-bold"
            title="Fermer"
          >
            ✕
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
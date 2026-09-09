import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import { ShoppingCart, Store, CheckCircle } from "lucide-react";

/**
 * 🛒 COMPOSANT : ShopContainer.jsx
 * Emplacement : src/pages/Boutique/ShopContainer.jsx
 *
 * Boutique d'approvisionnement local B2B/B2G :
 * - Persistence du panier dans localStorage pour éviter la perte au rafraîchissement
 * - Redirection automatique vers la boutique après ajout au panier
 * - Filtrage strict des produits masqués
 */
export default function ShopContainer() {
  const { user, userProfile } = useAuth();
  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Notification de confirmation d'ajout
  const [notification, setNotification] = useState(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  // Navigation interne : 'grid' | 'detail' | 'cart'
  const [activeView, setActiveView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // État du panier avec persistence localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("ane_gorille_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Erreur lecture panier localStorage :", e);
      return [];
    }
  });

  // Sauvegarde automatique du panier dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ane_gorille_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Erreur écriture panier localStorage :", e);
    }
  }, [cart]);

  // 1. Écoute temps réel des utilisateurs pour enrichir la localisation des producteurs
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data();
        });
        setUsersMap(map);
      },
      (err) => {
        console.error("Erreur chargement profil producteurs :", err);
      },
    );

    return () => unsubscribeUsers();
  }, []);

  // 2. Écoute temps réel de la collection 'products'
  useEffect(() => {
    const productsRef = collection(db, "products");
    const unsubscribeProducts = onSnapshot(
      productsRef,
      (snapshot) => {
        const raw = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProductsList(raw);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur chargement produits :", err);
        setLoading(false);
      },
    );

    return () => unsubscribeProducts();
  }, []);

  // 3. Enrichissement avec les données de profil producteur
  const enrichedProducts = productsList.map((p) => {
    const producerId = p.producerId || p.userId || p.ownerId;
    const producerProfile = usersMap[producerId] || {};

    const companyName =
      p.producerCompany ||
      p.companyName ||
      producerProfile.companyName ||
      producerProfile.displayName ||
      "Exploitation Locale";

    const address =
      p.producerAddress ||
      producerProfile.address ||
      "Adresse renseignée en profil";
    const city = p.producerCity || producerProfile.city || "Commune locale";
    const zipCode = p.producerZipCode || producerProfile.zipCode || "";
    const department =
      p.producerDepartment ||
      (producerProfile.zipCode
        ? producerProfile.zipCode.substring(0, 2)
        : "") ||
      (zipCode ? zipCode.substring(0, 2) : "31");

    return {
      ...p,
      producerCompany: companyName,
      producerAddress: address,
      producerCity: city,
      producerZipCode: zipCode,
      producerDepartment: department,
    };
  });

  // 🔒 REGLE STRICTE : Exclure tous les produits masqués/désactivés par le producteur
  const visibleProducts = enrichedProducts.filter((p) => {
    const isHidden =
      p.isHidden === true ||
      p.status === "hidden" ||
      p.status === "draft" ||
      p.isPublished === false ||
      p.isMasked === true;
    return !isHidden;
  });

  // 4. Application des filtres utilisateur
  const filteredProducts = visibleProducts.filter((p) => {
    const matchesSearch =
      (p.title || p.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (p.producerCompany || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (p.producerCity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.producerDepartment || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    const matchesBio = !bioOnly || p.isBio === true;

    return matchesSearch && matchesCategory && matchesBio;
  });

  // 🛒 Gestion de l'ajout au panier + Redirection automatique vers la boutique
  const handleAddToCart = (product, quantityToAdd = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id,
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantityToAdd;
        return updated;
      }
      return [...prevCart, { ...product, quantity: quantityToAdd }];
    });

    // Message de notification temporaire
    setNotification(`✅ "${product.title || product.name}" ajouté au panier !`);
    setTimeout(() => setNotification(null), 3000);

    // Redirection automatique vers la boutique (grille)
    setActiveView("grid");
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("ane_gorille_cart");
    } catch (e) {
      console.error(e);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* NOTIFICATION FLOTTANTE */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* BARRE SUPÉRIEURE DE NAVIGATION ET PANIER */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <Store size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Catalogue des Producteurs Locaux
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Approvisionnement en circuit court auprès des exploitations
              agricoles certifiées
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView(activeView === "cart" ? "grid" : "cart")}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer shadow-sm ${
            activeView === "cart"
              ? "bg-gray-900 text-white"
              : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          <ShoppingCart size={18} />
          <span>Mon Panier ({totalCartCount})</span>
        </button>
      </div>

      {/* VUE 1 : PANIER & CHECKOUT */}
      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onBackToShop={() => setActiveView("grid")}
        />
      )}

      {/* VUE 2 : FICHE PRODUIT DÉTAILLÉE */}
      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={visibleProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      )}

      {/* VUE 3 : GRILLE PRINCIPALE DE LA BOUTIQUE */}
      {activeView === "grid" && (
        <div className="space-y-6">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            bioOnly={bioOnly}
            onBioOnlyChange={setBioOnly}
          />

          <ProductGrid
            products={filteredProducts}
            onSelectProduct={(product) => {
              setSelectedProduct(product);
              setActiveView("detail");
            }}
            onAddToCart={handleAddToCart}
          />
        </div>
      )}
    </div>
  );
}

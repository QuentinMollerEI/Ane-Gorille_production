import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";
import { ShoppingCart, Store, CheckCircle } from "lucide-react";

export default function ShopContainer() {
  const { user } = useAuth();
  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  const [activeView, setActiveView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const cartKey = user?.uid ? `ane_gorille_cart_${user.uid}` : "ane_gorille_cart_guest";

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    if (cartKey !== "ane_gorille_cart_guest") {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, cartKey]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.docs.forEach((doc) => { map[doc.id] = doc.data(); });
      setUsersMap(map);
    });
    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductsList(raw);
      setLoading(false);
    });
    return () => unsubscribeProducts();
  }, []);

  // Correction : Extraction dynamique et stricte du département via le code postal
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
      producerDepartment: (postalCode ? postalCode.substring(0, 2) : "31"),
    };
  }).filter((p) => !(p.isHidden || p.status === "hidden" || p.status === "draft" || p.isMasked));

  const filteredProducts = enrichedProducts.filter((p) => {
    const matchesSearch = (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.producerCompany || "").toLowerCase().includes(searchTerm.toLowerCase());
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
    setActiveView("grid");
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) return setCart((prev) => prev.filter((item) => item.id !== id));
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-800 text-white font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <CheckCircle size={18} /><span>{notification}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl"><Store size={26} /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Boutique & Approvisionnement</h1>
            <p className="text-xs text-gray-500 font-semibold">Circuit court auprès des exploitations locales certifiées</p>
          </div>
        </div>
        <button
          onClick={() => setActiveView(activeView === "cart" ? "grid" : "cart")}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-2.5 shadow-sm cursor-pointer ${
            activeView === "cart" ? "bg-gray-900 text-white" : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          <ShoppingCart size={18} /><span>Mon Panier ({totalCartCount})</span>
        </button>
      </div>

      {activeView === "cart" && (
        <CartContainer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={(id) => setCart((prev) => prev.filter((item) => item.id !== id))}
          onClearCart={() => { setCart([]); localStorage.removeItem(cartKey); }}
          onBackToShop={() => setActiveView("grid")}
        />
      )}

      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={enrichedProducts}
          onBack={() => setActiveView("grid")}
          onAddToCart={handleAddToCart}
          onSelectProduct={setSelectedProduct}
        />
      )}

      {activeView === "grid" && (
        <div className="space-y-6">
          <FilterBar
            searchQuery={searchTerm} setSearchQuery={setSearchTerm}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            onlyBio={bioOnly} setOnlyBio={setBioOnly}
          />
          <ProductGrid products={filteredProducts} onSelectProduct={(p) => { setSelectedProduct(p); setActiveView("detail"); }} onAddToCart={handleAddToCart} />
        </div>
      )}
    </div>
  );
}
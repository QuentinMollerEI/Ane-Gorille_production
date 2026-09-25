import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { db } from "../../config/firebase.js";
import { collection, onSnapshot } from "firebase/firestore";
import FilterBar from "./components/FilterBar.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import ProductDetailPage from "./components/ProductDetailPage.jsx";
import CartContainer from "./components/CartContainer.jsx";
import { ShoppingCart, Store, CheckCircle } from "lucide-react";

export default function ShopContainer() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [productsList, setProductsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bioOnly, setBioOnly] = useState(false);

  const [activeView, setActiveView] = useState("grid"); // 'grid' | 'detail' | 'cart'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Écoute en temps réel des utilisateurs pour enrichir le profil du maraîcher
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.docs.forEach((docSnap) => { map[docSnap.id] = docSnap.data(); });
      setUsersMap(map);
    });
    return () => unsubscribeUsers();
  }, []);

  // Écoute en temps réel du catalogue
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const raw = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setProductsList(raw);
      setLoading(false);
    });
    return () => unsubscribeProducts();
  }, []);

  const enrichedProducts = productsList.map((p) => {
    const producerId = p.producerId || p.userId || p.ownerId;
    const profile = usersMap[producerId] || {};
    return {
      ...p,
      producerCompany: p.producerCompany || p.companyName || profile.companyName || profile.displayName || "Exploitation Locale",
      producerCity: p.producerCity || profile.city || "Commune locale"
    };
  }).filter((p) => !(p.isHidden || p.status === "hidden" || p.status === "draft" || p.isMasked));

  const filteredProducts = enrichedProducts.filter((p) => {
    const matchesSearch = (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.producerCompany || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesBio = !bioOnly || p.isBio === true;
    return matchesSearch && matchesCategory && matchesBio;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[350px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 text-xs font-sans">
      {/* En-tête de la Boutique */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <Store size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Boutique & Approvisionnement Local</h1>
            <p className="text-xs text-slate-500 font-semibold">
              Circuit court auprès des exploitations certifiées de la région
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView(activeView === "cart" ? "grid" : "cart")}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-sm cursor-pointer ${
            activeView === "cart" ? "bg-slate-900 text-white" : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          <ShoppingCart size={18} />
          <span>Mon Panier ({cartCount})</span>
        </button>
      </div>

      {/* Routage Interne de la Boutique */}
      {activeView === "cart" && (
        <CartContainer onBackToShop={() => setActiveView("grid")} />
      )}

      {activeView === "detail" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onBack={() => setActiveView("grid")}
          onSelectProduct={setSelectedProduct}
        />
      )}

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
            onSelectProduct={(product) => {
              setSelectedProduct(product);
              setActiveView("detail");
            }}
          />
        </div>
      )}
    </div>
  );
}
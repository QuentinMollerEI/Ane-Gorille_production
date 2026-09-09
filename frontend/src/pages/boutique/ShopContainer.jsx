import React, { useState, useEffect } from "react";
import { fetchActiveProducts } from "../../services/firestore.service";
import { useCart } from "../../context/CartContext";
import { Store, Search, ShoppingBag, ShoppingCart } from "lucide-react";

// Imports corrigés depuis le sous-dossier components/
import ProductCard from "./components/ProductCard";
import ProductDetailPage from "./components/ProductDetailPage";
import CartContainer from "./components/CartContainer";

/**
 * 🛒 PAGE PARENTE : ShopContainer.jsx
 * Responsabilité unique : Orchestrer l'affichage de la Boutique, la Fiche Produit Plein Écran,
 * et la bascule directe vers le Grand Panier (CartContainer).
 */
export default function ShopContainer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducer, setSelectedProducer] = useState("all");
  const [onlyBio, setOnlyBio] = useState(false);

  const cartContext = useCart ? useCart() : null;
  const cartItems = cartContext?.cart || [];
  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || item.qty || 1),
    0,
  );

  const handleAddToCart = (product, quantity = 1) => {
    if (cartContext && cartContext.addToCart) {
      cartContext.addToCart(product, quantity);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchActiveProducts()
      .then((data) => {
        if (isMounted) {
          setProducts(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur de chargement de la boutique :", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const producersList = Array.from(
    new Set(
      (products || []).map((p) => p.producer || p.producerName).filter(Boolean),
    ),
  );

  const filteredProducts = (products || []).filter((p) => {
    const isVisible = !p.isHidden;

    const matchesSearch =
      (p.title || p.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (p.producer || p.producerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      (p.category || "").toLowerCase() === selectedCategory.toLowerCase();

    const matchesProducer =
      selectedProducer === "all" ||
      (p.producer || p.producerName) === selectedProducer;

    const matchesBio = !onlyBio || Boolean(p.isBio || p.bio);

    return (
      isVisible &&
      matchesSearch &&
      matchesCategory &&
      matchesProducer &&
      matchesBio
    );
  });

  const bioButtonClass = onlyBio
    ? "bg-amber-400 text-gray-900 border-amber-300 shadow-sm"
    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100";

  // 1. SI L'ONGLET GRAND PANIER EST ACTIF
  if (showCart) {
    return <CartContainer onBackToShop={() => setShowCart(false)} />;
  }

  // 2. SI UN PRODUIT EST SÉLECTIONNÉ ➔ AFFICHER LA FICHE PLEIN ÉCRAN
  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        allProducts={products}
        onBack={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
    );
  }

  // 3. CATALOGUE GÉNÉRAL DE LA BOUTIQUE
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* EN-TÊTE PRINCIPAL AVEC ACCÈS AU GRAND PANIER */}
      <div className="border-b border-gray-150 pb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Store size={28} />
            </span>
            Boutique & Marché Local B2B / B2G
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
            Alimentation fraîche en circuit court direct producteurs — Livrée en
            caisses réutilisables consignées.
          </p>
        </div>

        {/* BOUTON D'ACCÈS AU GRAND PANIER */}
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className="inline-flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.99] shrink-0 self-start sm:self-auto"
        >
          <ShoppingCart size={18} />
          <span>Mon Panier</span>
          {itemCount > 0 && (
            <span className="bg-amber-400 text-gray-900 text-[11px] font-black px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher un légume, fruit, maraîcher..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <select
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              <option value="Légumes">Légumes</option>
              <option value="Fruits">Fruits</option>
              <option value="Herbes">Herbes</option>
              <option value="Transformés">Transformés</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-emerald-500"
              value={selectedProducer}
              onChange={(e) => setSelectedProducer(e.target.value)}
            >
              <option value="all">Tous les producteurs</option>
              {producersList.map((prod, idx) => (
                <option key={idx} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setOnlyBio(!onlyBio)}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1 border ${bioButtonClass}`}
            >
              <span>Bio</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER DES PRODUITS */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onOpenDetails={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-sm">
          <ShoppingBag
            size={40}
            className="mx-auto text-gray-300 stroke-[1.5]"
          />
          <p className="text-base font-bold text-gray-700">
            Aucun produit disponible ne correspond à ces critères.
          </p>
          <p className="text-xs text-gray-400">
            Essayez de modifier vos filtres de recherche ou de réinitialiser la
            sélection.
          </p>
        </div>
      )}
    </div>
  );
}

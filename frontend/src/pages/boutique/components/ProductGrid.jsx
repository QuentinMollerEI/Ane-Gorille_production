import React, { useState } from "react";
import ProductCard from "./ProductCard";
import { Package, LayoutGrid, List, ShoppingBag, MapPin, Store, Building } from "lucide-react";

export default function ProductGrid({
  products = [],
  onSelectProduct,
  onOpenDetails,
  onViewDetails,
  onAddToCart,
}) {
  // Mode d'affichage : 'grid' (cartes) ou 'table' (tableau B2B compact)
  const [viewMode, setViewMode] = useState("grid");
  
  // Quantités sélectionnées par produit pour la commande rapide en tableau
  const [quantities, setQuantities] = useState({});

  const handleSelect = onSelectProduct || onOpenDetails || onViewDetails;

  const handleQuantityChange = (productId, val, maxStock) => {
    const qty = Math.max(1, Math.min(maxStock, Number(val) || 1));
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
        <Package size={40} className="mx-auto text-gray-300" />
        <h3 className="text-base font-bold text-gray-800">
          Aucun produit disponible
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Aucun produit ne correspond à vos critères de recherche ou l'ensemble des récoltes de cette catégorie est actuellement masqué.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de Commutation : Grille Visuelle vs Tableau Compact */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-xs text-xs">
        <span className="font-extrabold text-gray-700">
          {products.length} {products.length > 1 ? "récoltes disponibles" : "récolte disponible"}
        </span>

        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
            title="Vue Grille Visuelle"
          >
            <LayoutGrid size={15} />
            <span className="hidden sm:inline">Grille Visuelle</span>
          </button>

          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
            title="Vue Tableau Compact (Commande Rapide)"
          >
            <List size={15} />
            <span className="hidden sm:inline">Tableau Compact </span>
          </button>
        </div>
      </div>

      {/* 1. MODE GRILLE VISUELLE */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={handleSelect}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {/* 2. MODE TABLEAU COMPACT  */}
      {viewMode === "table" && (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4">Producteur</th>
                  <th className="py-3 px-4">Dépt</th>
                  <th className="py-3 px-4 text-right">Prix HT</th>
                  <th className="py-3 px-4 text-right">Prix TTC</th>
                  <th className="py-3 px-4 text-center">Stock dispo</th>
                  <th className="py-3 px-4 text-center">Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {products.map((p) => {
                  const priceHT = Number(p?.priceHT ?? p?.price ?? 0);
                  const vatRate = Number(p?.vatRate ?? p?.vat ?? 5.5);
                  const priceTTC = priceHT * (1 + vatRate / 100);
                  const stock = Number(p?.stock ?? 0);
                  const isAvailable = stock > 0;
                  const producerName = p?.producerCompany || p?.producerName || "Exploitation Locale";
                  
                  const rawPostalCode = p?.producerPostalCode || p?.postalCode || "";
                  const cleanPostalDigits = String(rawPostalCode).replace(/\D/g, "");
                  let producerDept = null;
                  if (cleanPostalDigits.length >= 2) {
                    producerDept = cleanPostalDigits.substring(0, 2);
                  } else if (typeof p?.producerDepartment === "string" && /^\d{2}$/.test(p.producerDepartment.trim())) {
                    producerDept = p.producerDepartment.trim();
                  }

                  const selectedQty = quantities[p.id] || 1;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Produit & Photo */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => handleSelect && handleSelect(p)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                            {p.imageUrl || p.image ? (
                              <img src={p.imageUrl || p.image} alt={p.title || p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <Building size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900 group-hover:text-emerald-800 transition-colors text-xs">
                                {p.title || p.name}
                              </span>
                              {p.isBio && (
                                <span className="bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-md text-[9px] uppercase">
                                  Bio
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              {p.category || "Général"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Producteur */}
                      <td className="py-3 px-4 font-bold text-gray-700">
                        <span className="flex items-center gap-1">
                          <Store size={12} className="text-emerald-700 shrink-0" />
                          <span className="truncate max-w-[160px]">{producerName}</span>
                        </span>
                      </td>

                      {/* Département */}
                      <td className="py-3 px-4">
                        {producerDept ? (
                          <span className="inline-flex items-center gap-0.5 bg-gray-100 text-gray-700 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
                            <MapPin size={10} className="text-emerald-600" />
                            {producerDept}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Prix HT */}
                      <td className="py-3 px-4 text-right font-black text-gray-900">
                        {priceHT.toFixed(2)} € <span className="text-[10px] font-normal text-gray-400">/ {p.unit || "kg"}</span>
                      </td>

                      {/* Prix TTC */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">
                        {priceTTC.toFixed(2)} €
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${isAvailable ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                          {isAvailable ? `${stock} ${p.unit || "kg"}` : "Épuisé"}
                        </span>
                      </td>

                      {/* Action Commande Rapide */}
                      <td className="py-3 px-4 text-center">
                        {isAvailable ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max={stock}
                              value={selectedQty}
                              onChange={(e) => handleQuantityChange(p.id, e.target.value, stock)}
                              className="w-14 p-1.5 border border-gray-300 rounded-lg text-center font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => onAddToCart && onAddToCart(p, selectedQty)}
                              className="bg-emerald-800 hover:bg-emerald-900 text-white font-black px-3 py-1.5 rounded-xl uppercase tracking-wider text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Ajouter au panier"
                            >
                              <ShoppingBag size={12} />
                              <span>+ Panier</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold text-[10px]">Indisponible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
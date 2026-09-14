import React from "react";
import ProductCard from "./ProductCard"; 
import { Package } from "lucide-react";

export default function ProductGrid({
  products = [],
  onSelectProduct,
  onOpenDetails,
  onViewDetails,
  onAddToCart,
}) {
  const handleSelect = onSelectProduct || onOpenDetails || onViewDetails;

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
        <Package size={40} className="mx-auto text-gray-300" />
        <h3 className="text-base font-bold text-gray-800">
          Aucun produit disponible
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Aucun produit ne correspond à vos critères ou l'ensemble des cultures
          de cette catégorie est masqué par les producteurs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelectProduct={handleSelect}
          onOpenDetails={handleSelect}
          onViewDetails={handleSelect}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
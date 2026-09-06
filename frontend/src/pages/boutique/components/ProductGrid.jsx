import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  onOpenDetails,
  onResetFilters,
}) {
  // Gestion de l'état vide (Empty State) avec bouton d'action
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50 w-full col-span-full">
        <p className="font-medium text-gray-700">
          Aucun légume ou produit ne correspond à votre recherche.
        </p>
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Essayez de modifier ou de réinitialiser vos filtres.
        </p>

        {/* Affichage conditionnel du bouton d'action si la fonction est fournie */}
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  // Grille fluide standard
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
}

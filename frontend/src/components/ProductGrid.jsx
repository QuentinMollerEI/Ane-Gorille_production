import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, onOpenDetails }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50 w-full col-span-full">
        <p className="font-medium">Aucun légume ou produit ne correspond à votre recherche.</p>
        <p className="text-xs text-gray-400 mt-1">Essayez de modifier ou de réinitialiser vos filtres.</p>
      </div>
    );
  }

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

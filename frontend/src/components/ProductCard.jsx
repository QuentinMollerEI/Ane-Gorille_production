import React from 'react';

export default function ProductCard({ product, onOpenDetails }) {
  if (!product) return null;

  // Calcul automatique du Prix TTC basé sur la taxe applicable
  const taxMultiplier = 1 + (product.vatRate / 100);
  const priceTTC = product.priceHT * taxMultiplier;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* Zone Image / Aperçu */}
      <div className="h-44 bg-gray-100 relative">
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isBio && (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-gold text-brand-dark shadow-sm uppercase tracking-wider">
              Bio
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm uppercase tracking-wider ${
            product.isAvailable ? 'bg-brand-green' : 'bg-red-500'
          }`}>
            {product.isAvailable ? 'Disponible' : 'Épuisé'}
          </span>
        </div>
      </div>

      {/* Informations textuelles */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">
            {product.producer || 'Producteur Local'}
          </p>
          <h3 className="font-bold text-sm text-brand-dark mb-2 line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </div>

        {/* Affichage des deux prix (HT et TTC) pour la conformité fiscale */}
        <div className="flex items-end justify-between mt-4 border-t border-gray-100 pt-3">
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase">Prix HT</p>
            <span className="text-sm font-bold text-gray-500">{product.priceHT.toFixed(2)} €</span>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-brand-green font-bold uppercase">Prix TTC ({product.vatRate}%)</p>
            <span className="text-base font-extrabold text-brand-green">
              {priceTTC.toFixed(2)} € <span className="text-[10px] font-normal text-gray-500">/ kg</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

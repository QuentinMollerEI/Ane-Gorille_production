import React from "react";
import { ShoppingBag, MapPin, Building, Award, Store } from "lucide-react";

export default function ProductCard({ product, onSelectProduct, onAddToCart }) {
  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? 0);

  const producerName = product?.producerCompany || product?.producerName || "Exploitation Locale";

  // Extraction dynamique sans fallback en dur
  const rawPostalCode = product?.producerPostalCode || product?.postalCode || "";
  const cleanPostalDigits = String(rawPostalCode).replace(/\D/g, "");
  let producerDepartment = null;
  if (cleanPostalDigits.length >= 2) {
    producerDepartment = cleanPostalDigits.substring(0, 2);
  } else if (typeof product?.producerDepartment === "string" && /^\d{2}$/.test(product.producerDepartment.trim())) {
    producerDepartment = product.producerDepartment.trim();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-emerald-600 transition-all flex flex-col justify-between group cursor-pointer text-xs">
      
      {/* Visuel & Badges */}
      <div 
        onClick={() => onSelectProduct && onSelectProduct(product)}
        className="relative w-full h-44 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-3"
      >
        {product.imageUrl || product.image ? (
          <img
            src={product.imageUrl || product.image}
            alt={product.title || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Building size={36} />
          </div>
        )}

        {/* Badge Département (uniquement si présent) */}
        {producerDepartment && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-xs">
            <MapPin size={11} className="text-emerald-400" />
            <span>Dépt: {producerDepartment}</span>
          </div>
        )}

        {/* Badge Bio (EGAlim) */}
        {product.isBio && (
          <div className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-950 font-black px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1 shadow-xs">
            <Award size={12} className="text-amber-900" />
            <span>Bio</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
            <Store size={11} />
            {producerName}
          </span>
          <h3 
            onClick={() => onSelectProduct && onSelectProduct(product)}
            className="font-black text-gray-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1 mt-0.5"
          >
            {product.title || product.name}
          </h3>
        </div>

        {/* Prix & Stock ("hangar" supprimé) */}
        <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
          <div>
            <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Prix Unitaire HT</span>
            <p className="text-sm font-black text-gray-900">
              {priceHT.toFixed(2)} € <span className="text-[10px] font-bold text-gray-500">/ {product.unit || "kg"}</span>
            </p>
            <p className="text-[10px] font-extrabold text-emerald-800">
              {priceTTC.toFixed(2)} € TTC
            </p>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold text-gray-400 block">Stock disponible</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${stock > 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
              {stock > 0 ? `${stock} ${product.unit || "kg"}` : "Rupture"}
            </span>
          </div>
        </div>

        {/* Action Panier */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (stock > 0 && onAddToCart) {
              onAddToCart(product, 1);
            }
          }}
          disabled={stock <= 0}
          className={`w-full py-2.5 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            stock > 0
              ? "bg-emerald-800 hover:bg-emerald-900 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ShoppingBag size={14} />
          <span>{stock > 0 ? "Ajouter au panier" : "Indisponible"}</span>
        </button>
      </div>
    </div>
  );
}
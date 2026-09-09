import React from "react";
import { MapPin, Camera, Tag, ShoppingBag } from "lucide-react";

/**
 * 🌿 COMPOSANT : ProductCard.jsx
 * Visuel exact de la capture d'écran avec support de la photo récolte.
 * Sécurisé contre l'erreur "onOpenDetails is not a function".
 */
export default function ProductCard({
  product,
  onSelectProduct,
  onOpenDetails,
  onViewDetails,
  onAddToCart,
}) {
  if (!product) return null;

  // Sécurité callback : accepte n'importe quel nom de prop passé par le parent
  const handleCardClick = () => {
    const callback = onOpenDetails || onSelectProduct || onViewDetails;
    if (typeof callback === "function") {
      callback(product);
    }
  };

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? 0);
  const isAvailable = stock > 0;

  const producerName = (
    product?.producerCompany ||
    product?.producerName ||
    "EXPLOITATION LOCALE"
  ).toUpperCase();

  const deptCode =
    product?.producerDepartment ||
    product?.producerZipCode?.substring(0, 2) ||
    "31";
  const imageSrc = product?.imageUrl || product?.image || null;

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white border border-gray-200 hover:border-emerald-600 rounded-2xl p-3.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3 relative"
    >
      {/* BADGE EN STOCK / ÉPUISÉ EN HAUT À DROITE */}
      <div className="absolute top-5 right-5 z-10">
        {isAvailable ? (
          <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            En Stock
          </span>
        ) : (
          <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Épuisé
          </span>
        )}
      </div>

      {/* ZONE VISUEL / PHOTO AVEC BADGE DÉPARTEMENT FLOTTANT */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-150">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.title || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
            <Camera size={26} />
            <span className="text-[10px] font-bold">Aucun visuel fourni</span>
          </div>
        )}

        {/* BADGE LOCALISATION SUR L'IMAGE (BAS-GAUCHE) */}
        <div className="absolute bottom-2 left-2 bg-black/65 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
          <MapPin size={10} className="text-emerald-400" />
          <span>Dépt: {deptCode}</span>
        </div>
      </div>

      {/* CORPS DE CARTE : PRODUCTEUR ET NOM DE LA CULTURE */}
      <div className="space-y-1">
        <div className="text-[10px] text-gray-500 font-extrabold tracking-wider flex items-center gap-1">
          <Tag size={12} className="text-emerald-700 shrink-0" />
          <span className="truncate">{producerName}</span>
        </div>

        <h3 className="font-black text-gray-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1">
          {product.title || product.name}
        </h3>
      </div>

      {/* BLOC TARIFICATION HT ET TTC */}
      <div className="pt-2 border-t border-gray-100 flex items-end justify-between gap-2">
        <div>
          <span className="text-[9px] font-black text-gray-400 uppercase block">
            Prix HT
          </span>
          <p className="text-sm font-black text-gray-900 leading-tight">
            {priceHT.toFixed(2)} €
          </p>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-black text-emerald-800 uppercase block">
            Prix TTC ({vatRate}%)
          </span>
          <p className="text-xs font-black text-emerald-800 leading-tight">
            {priceTTC.toFixed(2)} € / {product.unit || "kg"}
          </p>
        </div>
      </div>

      {/* PIED DE CARTE ARRONDI : STOCK DISPO ET BOUTON D'AJOUT */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 font-bold text-gray-600">
          <span>Stock dispo :</span>
          <span className="font-extrabold text-amber-900">
            {stock} {product.unit || "kg"}
          </span>
        </div>

        {isAvailable && onAddToCart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px] cursor-pointer shadow-xs"
            title="Ajouter 1 au panier"
          >
            <ShoppingBag size={12} />
            <span>+ Panier</span>
          </button>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Tag, MapPin, Camera } from "lucide-react";

/**
 * 🥕 COMPOSANT : ProductCard.jsx
 * Responsabilité unique : Afficher la fiche unitaire d'un produit dans la boutique
 * exactement selon la maquette visuelle (image/visuel, badges, prix HT/TTC, stock).
 */
export default function ProductCard({ product, onOpenDetails }) {
  if (!product) return null;

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product]);

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const taxMultiplier = 1 + vatRate / 100;
  const priceTTC = priceHT * taxMultiplier;

  const stock = Number(product?.stock ?? product?.quantity ?? 0);
  const isAvailable = Boolean(product?.isAvailable ?? stock > 0);
  const isBio = Boolean(product?.isBio ?? product?.bio ?? false);
  const title = product?.title ?? product?.name ?? "Produit sans nom";
  const producer = (
    product?.producer ??
    product?.producerName ??
    "Producteur Local"
  ).toUpperCase();
  const unit = product?.unit ?? "kg";
  const origin = product?.origin || product?.department || "Dépt: Local";

  let imageUrl = null;
  const rawImg =
    product?.imageUrl ||
    product?.image ||
    product?.photo ||
    product?.imgUrl ||
    product?.img ||
    product?.picture ||
    product?.url;

  if (rawImg) {
    if (typeof rawImg === "string" && rawImg.trim() !== "") {
      imageUrl = rawImg.trim();
    } else if (rawImg instanceof File || rawImg instanceof Blob) {
      imageUrl = URL.createObjectURL(rawImg);
    }
  }

  const showPlaceholder = !imageUrl || imgError;

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(product)}
      className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-0.5 group"
    >
      {/* 🖼️ ZONE IMAGE / VISUEL */}
      <div className="h-48 bg-gray-50/80 relative overflow-hidden flex items-center justify-center">
        {!showPlaceholder ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 space-y-1.5 p-4 text-center">
            <Camera size={36} className="text-gray-300 stroke-[1.5]" />
            <span className="text-xs font-semibold text-gray-400">
              Aucun visuel fourni
            </span>
          </div>
        )}

        {/* Badge Bio (Haut Gauche) */}
        {isBio && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-900 shadow-sm uppercase tracking-wider">
              Bio
            </span>
          </div>
        )}

        {/* Badge Disponibilité (Haut Droite) */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full text-white shadow-sm uppercase tracking-wider ${
              isAvailable ? "bg-emerald-600" : "bg-red-500"
            }`}
          >
            {isAvailable ? "EN STOCK" : "ÉPUISÉ"}
          </span>
        </div>

        {/* Badge Localisation / Origine (Bas Gauche) */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
            <MapPin size={11} className="text-red-400" />
            <span>{origin}</span>
          </span>
        </div>
      </div>

      {/* 📝 CORPS DE LA FICHE */}
      <div className="p-4 space-y-3 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            <Tag size={12} className="text-gray-400" />
            <span>{producer}</span>
          </div>

          <h3 className="font-bold text-base text-gray-900 leading-tight line-clamp-2">
            {title}
          </h3>
        </div>

        <div>
          <div className="border-b border-gray-100 my-2" />

          <div className="flex items-end justify-between pt-1">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                PRIX HT
              </p>
              <p className="text-sm font-bold text-gray-700">
                {priceHT.toFixed(2)} €
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                PRIX TTC ({vatRate}%)
              </p>
              <p className="text-lg font-black text-emerald-700 leading-none">
                {priceTTC.toFixed(2)} €{" "}
                <span className="text-xs font-semibold text-gray-500">
                  / {unit}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-600 mt-3">
            <span>Stock dispo :</span>
            <span className="font-bold text-amber-800">
              {stock} {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Camera, MapPin, Tag } from "lucide-react";

export default function ProductCard({ product, onOpenDetails }) {
  if (!product) return null;

  // Calcul automatique du Prix TTC basé sur la taxe applicable (loi LME / Conformité fiscale B2B/B2G)
  const priceHT = Number(product?.priceHT ?? 0);
  const vatRate = Number(product?.vatRate ?? 5.5);
  const taxMultiplier = 1 + vatRate / 100;
  const priceTTC = priceHT * taxMultiplier;

  const isAvailable = Number(product?.stock ?? 0) > 0;
  const isBio = Boolean(product?.isBio ?? false);
  const title = product?.title ?? product?.name ?? "Produit sans nom";
  const producer = product?.producer ?? "Producteur Anonyme";
  const department = product?.department ?? "Local";
  const unit = product?.unit ?? "kg";
  const stock = Number(product?.stock ?? 0);
  const image = product?.image || "";

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="bg-white rounded-2xl shadow-sm border border-gray-150 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1 group"
    >
      {/* Zone Image / Photo du produit */}
      <div className="h-48 bg-gray-50 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 group-hover:text-green-600 transition-colors">
            <Camera size={36} className="stroke-1" />
            <span className="text-[10px] font-semibold mt-2">
              Aucun visuel fourni
            </span>
          </div>
        )}

        {/* Badges de Labels et Disponibilité */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isBio && (
            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-400 text-amber-950 shadow-sm uppercase tracking-wider border border-amber-300">
              🥦 Bio AB
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`text-[9px] font-black px-2.5 py-1 rounded-full text-white shadow-sm uppercase tracking-wider ${
              isAvailable ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {isAvailable ? "En Stock" : "Épuisé"}
          </span>
        </div>

        {/* Localisation - Département */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
          <MapPin size={10} className="text-red-400" />
          <span>Dépt: {department}</span>
        </div>
      </div>

      {/* Informations Textuelles */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
            <Tag size={10} />
            <span>{producer}</span>
          </div>
          <h3 className="font-extrabold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
            {title}
          </h3>
        </div>

        {/* Grille Tarifs et Stock */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          {/* Tarification Double (HT & TTC) pour conformité B2B/B2G */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">
                Prix HT
              </p>
              <span className="text-xs font-bold text-gray-500">
                {priceHT.toFixed(2)} €
              </span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-green-700 font-black uppercase leading-none mb-1">
                Prix TTC ({vatRate}%)
              </p>
              <span className="text-base font-black text-green-700">
                {priceTTC.toFixed(2)} €{" "}
                <span className="text-[10px] font-normal text-gray-500">
                  / {unit}
                </span>
              </span>
            </div>
          </div>

          {/* État des Stocks restant en direct */}
          <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="font-medium">Stock dispo :</span>
            <span
              className={`font-bold ${stock > 15 ? "text-green-700" : stock > 0 ? "text-amber-700" : "text-red-600"}`}
            >
              {stock} {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

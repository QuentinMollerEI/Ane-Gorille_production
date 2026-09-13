import React, { useState } from "react";
import { ArrowLeft, ShoppingBag, MapPin, Building, Award } from "lucide-react";

export default function ProductDetailPage({ product, allProducts = [], onBack, onAddToCart, onSelectProduct }) {
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? 0);
  
  const producerName = product?.producerCompany || product?.producerName || "Exploitation Agricole Locale";
  const producerAddress = product?.producerAddress || "Adresse validée au registre";
  const producerCity = product?.producerCity || "Commune locale";
  const producerPostalCode = product?.producerPostalCode || "";
  const producerDepartment = product?.producerDepartment || "31";

  const otherProducerProducts = allProducts.filter((p) => {
    const isSameProducer = p.producerId === product.producerId || p.producerCompany === product.producerCompany;
    const isDifferentProduct = p.id !== product.id;
    const isVisible = !p.isHidden && p.status !== "hidden" && p.isPublished !== false && !p.isMasked;
    return isSameProducer && isDifferentProduct && isVisible;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12 text-xs">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>Retour au catalogue</span>
        </button>
        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Fiche de Traçabilité {product.id?.substring(0, 8) || "REF-AGRI"}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-5 relative w-full h-64 md:h-80 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
          {product.imageUrl || product.image ? (
            <img src={product.imageUrl || product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400 space-y-2">
              <Building size={48} className="mx-auto" />
              <p className="font-bold text-xs">Aucun visuel fourni</p>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1">
            <MapPin size={12} className="text-emerald-400" />
            <span>Dépt: {producerDepartment}</span>
          </div>
        </div>

        <div className="md:col-span-7 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Producteur Vérifié</span>
              {product.isBio && (
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award size={12} /><span>Bio (EGAlim)</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900">{product.title || product.name}</h1>
            <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mt-0.5">{producerName}</p>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
            <p className="font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-700 shrink-0" />
              <span>{producerAddress} {producerPostalCode} {producerCity}</span>
            </p>
            <p className="text-[10px] text-gray-500 italic">Adresse certifiée au registre des exploitants agricoles.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-gray-400 font-extrabold uppercase text-[9px] block">Tarif Unitaire HT</span>
              <p className="text-base font-black text-gray-900">{priceHT.toFixed(2)} € / {product.unit || "kg"}</p>
              <p className="text-emerald-800 font-bold text-[10px]">Prix TTC : {priceTTC.toFixed(2)} €</p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-gray-400 font-extrabold uppercase text-[9px] block">Disponibilité Hangar</span>
              <p className="text-base font-black text-gray-900">{stock} {product.unit || "kg"}</p>
              <p className="text-gray-500 font-bold text-[10px]">Livraison 24h-48h</p>
            </div>
          </div>

          {stock > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value))))}
                  className="w-24 p-3 border border-gray-300 rounded-xl font-bold text-center text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3.5 px-6 rounded-2xl uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>Ajouter au panier ({(priceTTC * quantity).toFixed(2)} € TTC)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-center">Ce produit est actuellement en rupture de stock.</div>
          )}
        </div>
      </div>

      {otherProducerProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <Building size={16} className="text-emerald-700" />
            <span>Toutes les autres cultures disponibles de {producerName}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {otherProducerProducts.map((p) => {
              const pHT = Number(p.priceHT ?? p.price ?? 0);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct && onSelectProduct(p)}
                  className="p-3 border border-gray-200 hover:border-emerald-600 rounded-2xl cursor-pointer transition-all flex items-center gap-3 bg-gray-50/50 hover:bg-white"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    {p.imageUrl || p.image ? (
                      <img src={p.imageUrl || p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-[10px]">N/A</div>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-extrabold text-gray-900 text-xs truncate">{p.title || p.name}</p>
                    <p className="text-emerald-800 font-bold text-[10px]">{pHT.toFixed(2)} € HT / {p.unit || "kg"}</p>
                    <p className="text-[9px] text-gray-500 font-bold">Stock : {p.stock || 0} {p.unit || "kg"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
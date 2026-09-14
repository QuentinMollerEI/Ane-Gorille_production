import React, { useState } from "react";
import { ArrowLeft, ShoppingBag, MapPin, Building, Award, Store, FileText, Sparkles, Info } from "lucide-react";

export default function ProductDetailPage({
  product,
  allProducts = [],
  onBack,
  onAddToCart,
  onSelectProduct,
  onOpenProducerStore,
}) {
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? 0);

  const producerName = product?.producerCompany || product?.producerName || "Exploitation Agricole Locale";
  const producerAddress = product?.producerAddress || "Adresse certifiée au registre";
  const producerCity = product?.producerCity || product?.city || "";
  
  const rawPostalCode = product?.producerPostalCode || product?.postalCode || "";
  const cleanPostalDigits = String(rawPostalCode).replace(/\D/g, "");
  
  let producerDepartment = null;
  if (cleanPostalDigits.length >= 2) {
    producerDepartment = cleanPostalDigits.substring(0, 2);
  } else if (typeof product?.producerDepartment === "string" && /^\d{2}$/.test(product.producerDepartment.trim())) {
    producerDepartment = product.producerDepartment.trim();
  }

  const eggRearingLabels = {
    "0": "0 - Biologique (AB)",
    "1": "1 - Plein Air",
    "2": "2 - Au Sol (Intérieur)",
    "3": "3 - En Cage aménagement"
  };

  // VÉRIFICATION STRICTE DE LA FILIÈRE DU PRODUIT
  const categoryStr = (product.category || "").toLowerCase();
  const titleStr = (product.title || product.name || "").toLowerCase();

  const isHoney = categoryStr.includes("miel") || titleStr.includes("miel");
  const isEggs = categoryStr.includes("œuf") || categoryStr.includes("oeuf") || categoryStr.includes("élevage") || titleStr.includes("œuf") || titleStr.includes("oeuf");

  const otherProducerProducts = allProducts.filter((p) => {
    const isSameProducer = p.producerId === product.producerId || (p.producerCompany && p.producerCompany === product.producerCompany);
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
            <img
              src={product.imageUrl || product.image}
              alt={product.title || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-400 space-y-2">
              <Building size={48} className="mx-auto" />
              <p className="font-bold text-xs">Aucun visuel disponible</p>
            </div>
          )}
          
          {producerDepartment && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1">
              <MapPin size={12} className="text-emerald-400" />
              <span>Dépt: {producerDepartment}</span>
            </div>
          )}
        </div>

        <div className="md:col-span-7 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <button
                onClick={() => onOpenProducerStore && onOpenProducerStore(product.producerId)}
                className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Store size={12} />
                <span>Producteur Vérifié — Voir la boutique</span>
              </button>

              {product.isBio && (
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Award size={12} />
                  <span>Bio (EGAlim)</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-gray-900">{product.title || product.name}</h1>
            
            <button
              onClick={() => onOpenProducerStore && onOpenProducerStore(product.producerId)}
              className="text-xs text-emerald-800 font-extrabold uppercase tracking-wider mt-0.5 hover:underline cursor-pointer block"
            >
              {producerName}
            </button>
          </div>

          {/* 🍯 Encart Miel (Affiché SEULEMENT si c'est du Miel) */}
          {isHoney && (product.honeyNetWeight || product.floralOrigin) && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
              <p className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                <Sparkles size={14} className="text-amber-600 shrink-0" />
                <span>Spécificités du Miel & Apiculture</span>
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {product.honeyNetWeight && (
                  <p className="text-gray-800 font-medium">
                    <strong className="text-amber-900">Poids Net du Pot :</strong> {product.honeyNetWeight}
                  </p>
                )}
                {product.floralOrigin && (
                  <p className="text-gray-800 font-medium">
                    <strong className="text-amber-900">Origine florale :</strong> {product.floralOrigin}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 🥚 Encart Œufs (Affiché SEULEMENT si c'est la filière Œufs/Élevage) */}
          {isEggs && (product.eggRearingMode || product.eggCaliber || product.dcrDate) && (
            <div className="p-3.5 bg-yellow-50/80 border border-yellow-200 rounded-2xl space-y-1">
              <p className="font-extrabold text-yellow-950 flex items-center gap-1.5 text-xs">
                <Info size={14} className="text-yellow-700 shrink-0" />
                <span>Traçabilité Élevage & Œufs</span>
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {product.eggRearingMode && (
                  <p className="text-gray-800 font-medium">
                    <strong className="text-yellow-950">Mode d'élevage :</strong> {eggRearingLabels[product.eggRearingMode] || product.eggRearingMode}
                  </p>
                )}
                {product.eggCaliber && (
                  <p className="text-gray-800 font-medium">
                    <strong className="text-yellow-950">Calibre :</strong> {product.eggCaliber}
                  </p>
                )}
                {product.dcrDate && (
                  <p className="text-gray-800 font-medium col-span-2">
                    <strong className="text-yellow-950">DCR :</strong> {product.dcrDate}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Encart INCO */}
          {(product.ingredients || product.allergens || product.ddmDate || product.dlcDate || product.storageInstructions) && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <p className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                <FileText size={14} className="text-emerald-700 shrink-0" />
                <span>Composition & Traçabilité Sanitaire (INCO)</span>
              </p>
              {product.ingredients && (
                <p className="text-gray-800 text-[11px]">
                  <strong>Ingrédients :</strong> {product.ingredients}
                </p>
              )}
              {product.allergens && (
                <p className="text-red-700 font-bold text-[11px] bg-red-50 p-2 rounded-xl border border-red-200">
                  ⚠️ Allergènes : {product.allergens}
                </p>
              )}
              {(product.ddmDate || product.dlcDate) && (
                <p className="text-gray-700 font-medium text-[11px]">
                  <strong>Date limite (DDM/DLC) :</strong> {product.ddmDate || product.dlcDate}
                </p>
              )}
              {product.storageInstructions && (
                <p className="text-gray-600 text-[10px] italic">
                  <strong>Conservation :</strong> {product.storageInstructions}
                </p>
              )}
            </div>
          )}

          {/* Adresse Exploitation */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1">
            <p className="font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-700 shrink-0" />
              <span>
                {producerAddress}
                {producerCity ? ` — ${producerCity}` : ""}
                {producerDepartment ? ` (${producerDepartment})` : ""}
              </span>
            </p>
            <p className="text-[10px] text-gray-500 italic">Adresse certifiée au registre des exploitants agricoles.</p>
          </div>

          {/* Prix & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-gray-400 font-extrabold uppercase text-[9px] block">Tarif Unitaire HT</span>
              <p className="text-base font-black text-gray-900">{priceHT.toFixed(2)} € / {product.unit || "kg"}</p>
              <p className="text-emerald-800 font-bold text-[10px]">Prix TTC : {priceTTC.toFixed(2)} €</p>
            </div>
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-gray-400 font-extrabold uppercase text-[9px] block">Disponibilité</span>
              <p className="text-base font-black text-gray-900">{stock} {product.unit || "kg"}</p>
            </div>
          </div>

          {/* Action Panier */}
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
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-black py-3.5 px-6 rounded-2xl uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>Ajouter au panier ({(priceTTC * quantity).toFixed(2)} € TTC)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-center">
              Ce produit est actuellement en rupture de stock.
            </div>
          )}
        </div>
      </div>

      {/* Autres produits */}
      {otherProducerProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <Building size={16} className="text-emerald-700" />
            <span>Autres récoltes disponibles de {producerName}</span>
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
import React from "react";
import { ShoppingBag, MapPin, Award, Store } from "lucide-react";

// Helper d'extraction stricte du code département (2 premiers chiffres du Code Postal)
const getDepartmentCode = (product) => {
  if (!product) return null;

  const rawPostal = product.producerPostalCode || product.postalCode || product.zipCode || product.postal_code || "";
  const cleanDigits = String(rawPostal).replace(/\D/g, "");
  if (cleanDigits.length >= 2) {
    return cleanDigits.substring(0, 2);
  }

  const deptField = String(product.producerDepartment || product.department || product.departmentCode || product.origin || "").trim();
  const deptDigits = deptField.replace(/\D/g, "");
  if (deptDigits.length >= 2) {
    return deptDigits.substring(0, 2);
  }

  return null;
};

export default function ProductCard({
  product,
  onSelectProduct,
  onAddToCart,
  onOpenProducerStore,
}) {
  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? 0);

  const producerName = product?.producerCompany || product?.producerName || "Exploitation Locale";
  const deptCode = getDepartmentCode(product);

  return (
    <div className="bg-white border border-gray-200 hover:border-emerald-500 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group text-xs">
      
      {/* Zone Supérieure : Visuel & Badge Département */}
      <div className="space-y-3">
        <div 
          onClick={() => onSelectProduct && onSelectProduct(product)}
          className="relative w-full h-44 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer flex items-center justify-center group-hover:scale-[1.01] transition-transform"
        >
          {product.imageUrl || product.image ? (
            <img
              src={product.imageUrl || product.image}
              alt={product.title || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-400 font-bold text-[10px]">
              Visuel non disponible
            </div>
          )}

          {/* Badge Département */}
          {deptCode && (
            <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 z-10">
              <MapPin size={10} className="text-emerald-400 shrink-0" />
              <span>Dépt. {deptCode}</span>
            </div>
          )}
        </div>

        {/* Badges SIQO & Qualité (Bio, HVE, AOP, AOC, IGP, Label Rouge) */}
        <div className="flex flex-wrap items-center gap-1 min-h-[22px]">
          {product.isBio && (
            <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Award size={10} />
              <span>Bio</span>
            </span>
          )}

          {product.isHve && (
            <span className="text-[9px] font-black uppercase text-emerald-900 bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md">
              HVE
            </span>
          )}

          {product.isAop && (
            <span className="text-[9px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md">
              AOP
            </span>
          )}

          {product.isAoc && (
            <span className="text-[9px] font-black uppercase text-indigo-900 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-md">
              AOC
            </span>
          )}

          {product.isIgp && (
            <span className="text-[9px] font-black uppercase text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md">
              IGP
            </span>
          )}

          {(!product.isAop && !product.isAoc && !product.isIgp && product.isAopIgp) && (
            <span className="text-[9px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md">
              AOP / IGP
            </span>
          )}

          {product.isLabelRouge && (
            <span className="text-[9px] font-black uppercase text-red-900 bg-red-100 border border-red-300 px-2 py-0.5 rounded-md">
              Label Rouge
            </span>
          )}
        </div>

        {/* Titre et Producteur */}
        <div>
          <h3 
            onClick={() => onSelectProduct && onSelectProduct(product)}
            className="text-sm font-black text-gray-900 line-clamp-1 cursor-pointer hover:text-emerald-700 transition-colors"
          >
            {product.title || product.name}
          </h3>

          <button
            onClick={() => onOpenProducerStore && onOpenProducerStore(product.producerId)}
            className="text-[11px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors mt-0.5 cursor-pointer"
          >
            <Store size={12} className="text-emerald-600" />
            <span className="truncate">{producerName}</span>
          </button>
        </div>
      </div>

      {/* Zone Inférieure : Prix et Panier */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-base font-black text-gray-900">{priceHT.toFixed(2)} €</span>
            <span className="text-[10px] text-gray-400 font-bold"> HT / {product.unit || "kg"}</span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
            {priceTTC.toFixed(2)} € TTC
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-bold ${stock > 0 ? "text-gray-500" : "text-red-600 font-black"}`}>
            {stock > 0 ? `Stock : ${stock} ${product.unit || "kg"}` : "Rupture de stock"}
          </span>

          {stock > 0 && (
            <button
              onClick={() => onAddToCart && onAddToCart(product, 1)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-3.5 py-2 rounded-xl uppercase text-[10px] tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag size={13} />
              <span>Ajouter</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
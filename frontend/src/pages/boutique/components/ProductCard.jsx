import React, { useState } from "react";
import { ShoppingCart, Check, Minus, Plus, Leaf } from "lucide-react";
import { useCart } from "../../../context/CartContext.jsx";

export default function ProductCard({ product, onOpenDetails }) {
  const { addToCart } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const priceHT = Number(product.priceHT ?? product.price ?? 0);
  const vatRate = Number(product.vatRate ?? (product.category === "artisanat" ? 20 : 5.5));
  const availableStock = Number(product.stock ?? product.quantity ?? product.stockQuantity ?? 0);
  const isAvailable = availableStock > 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(product, selectedQty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(product)}
      className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative"
    >
      <div className="space-y-3">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={product.imageUrl || product.image || "/placeholder.png"}
            alt={product.name || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.egalimBadge && (
            <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow">
              <Leaf size={10} />
              {product.egalimBadge}
            </span>
          )}
          <span
            className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow ${
              isAvailable ? "bg-emerald-700 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {isAvailable ? `Stock : ${availableStock}` : "Épuisé"}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
            {product.producerName || product.farmName || "Maraîcher Local"}
          </p>
          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
            {product.name || product.title}
          </h3>
        </div>

        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
          <div>
            <span className="text-base font-black text-slate-900">{priceHT.toFixed(2)} € HT</span>
            <span className="text-[10px] font-semibold text-slate-500 block">
              / {product.unit || "kg"} (TVA {vatRate}%)
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            Lot: {product.batchNumber || "L-2026-001"}
          </span>
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center border border-slate-200 rounded-xl bg-slate-50"
        >
          <button
            onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors cursor-pointer"
          >
            <Minus size={12} />
          </button>
          <span className="px-2 text-xs font-black text-slate-800">{selectedQty}</span>
          <button
            onClick={() => setSelectedQty((q) => Math.min(availableStock, q + 1))}
            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
            !isAvailable
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : isAdded
              ? "bg-emerald-800 text-white"
              : "bg-emerald-700 hover:bg-emerald-800 text-white"
          }`}
        >
          {isAdded ? (
            <>
              <Check size={14} />
              Ajouté !
            </>
          ) : (
            <>
              <ShoppingCart size={14} />
              Ajouter
            </>
          )}
        </button>
      </div>
    </div>
  );
}